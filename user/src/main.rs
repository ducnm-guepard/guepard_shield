pub mod ebpf;

use aya::maps::RingBuf;
use common::SyscallInfo;
use csv::Writer;
use ebpf::attach_bpf;
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::ops::Deref;
use std::path::Path;
use std::sync::{Arc, Mutex};
use tokio::io::unix::AsyncFd;
use tokio::task;
use tokio_postgres::NoTls;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let (client, connection) =
        tokio_postgres::connect("postgresql://guepard:1234@localhost:5432/pagila", NoTls).await?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("Connection error: {}", e);
        }
    });

    let client = Arc::new(client);
    let syscalls = Arc::new(Mutex::new(Vec::new()));

    let mut bpf = attach_bpf()?;
    let ring_buf = RingBuf::try_from(bpf.map_mut("SYSCALLS").unwrap()).unwrap();
    let mut poll = AsyncFd::new(ring_buf)?;

    for label in [
        "boolean-based",
        "error-based",
        "inline",
        "normal",
        "stacked",
        "time-based",
        "union-based",
    ] {
        let reader = BufReader::new(File::open(format!("data/query/{}.txt", label))?);
        for line in reader.lines() {
            let query = line?;

            {
                let mut syscalls_lock = syscalls.lock().unwrap();
                syscalls_lock.clear();
            }

            let syscalls_clone = Arc::clone(&syscalls);
            let client_clone = Arc::clone(&client);

            let query_handle = task::spawn(async move {
                let _ = client_clone.query(query.as_str(), &[]).await.ok();
                let _ = write_syscalls_to_csv(syscalls_clone, &label).unwrap();
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
        }
    }

    Ok(())
}

// Hàm ghi syscalls vào file CSV
fn write_syscalls_to_csv(
    syscalls: Arc<Mutex<Vec<SyscallInfo>>>,
    label: &str,
) -> Result<(), Box<dyn std::error::Error>> {
    let path = Path::new("data/syscalls_log.csv");
    let file = File::options().append(true).create(true).open(path)?;

    let mut writer = Writer::from_writer(file);
    let syscalls_lock = syscalls.lock().unwrap();

    let syscall_nrs: Vec<u32> = syscalls_lock
        .iter()
        .map(|syscall| syscall.syscall_nr)
        .collect();

    let syscall_str = format!("{:?}", syscall_nrs);

    let _ = writer.write_record(&[syscall_str, label.to_owned()]);

    writer.flush()?;
    Ok(())
}
