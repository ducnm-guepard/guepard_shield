pub mod appender;
pub mod ebpf;

use appender::UniqueAppender;
use aya::maps::RingBuf;
use common::SyscallInfo;
use ebpf::attach_bpf;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::ops::Deref;
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::io::unix::AsyncFd;
use tokio::task;
use tokio::time::sleep;
use tokio_postgres::NoTls;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    env_logger::init();

    let (client, connection) =
        tokio_postgres::connect("postgresql://postgres:1234@localhost:5432/chinook", NoTls).await?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Connection error: {}", e);
        }
    });

    let client = Arc::new(client);

    let syscalls = Arc::new(Mutex::new(Vec::new()));
    let appender = Arc::new(Mutex::new(UniqueAppender::new("data/syscall/log.csv")));

    let mut bpf = attach_bpf()?;
    let ring_buf = RingBuf::try_from(bpf.map_mut("SYSCALLS").unwrap()).unwrap();
    let mut poll = AsyncFd::new(ring_buf)?;

    for label in [
        "boolean-based",
        "error-based",
        "normal",
        // "stacked",
        "time-based",
        "union-based",
    ] {
        let reader = BufReader::new(File::open(format!("data/query/{}.txt", label))?);
        for (line_num, line) in reader.lines().enumerate() {
            let query = line?;
            {
                let mut syscalls_lock = syscalls.lock().unwrap();
                syscalls_lock.clear();
            }

            let syscalls_clone = Arc::clone(&syscalls);
            let client_clone = Arc::clone(&client);
            let appender_clone = Arc::clone(&appender);

            let query_handle = task::spawn(async move {
                let _ = client_clone.query(query.as_str(), &[]).await.ok();
                let _ = appender_clone
                    .lock()
                    .unwrap()
                    .append(syscalls_clone, &label)
                    .unwrap();

                log::info!("Traced {}: {}", label, line_num);
            });

            loop {
                let mut guard = poll.readable_mut().await.unwrap();
                let ring_buf = guard.get_inner_mut();
                while let Some(item) = ring_buf.next() {
                    let info = unsafe { &*(item.deref().as_ptr() as *const SyscallInfo) };
                    let mut syscalls_lock = syscalls.lock().unwrap();
                    syscalls_lock.push(info.to_owned());
                }
                guard.clear_ready();

                if query_handle.is_finished() {
                    break;
                }
            }

            sleep(Duration::from_micros(500)).await;
        }
    }

    Ok(())
}
