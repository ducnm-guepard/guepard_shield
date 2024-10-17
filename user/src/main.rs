pub mod ebpf;
pub mod syscall_tracing;

use std::{fs::OpenOptions, io::Write};

use log::info;
use syscall_tracing::trace_syscall;
use tokio::signal;
use tokio_postgres::NoTls;
#[tokio::main]
async fn main() -> Result<(), anyhow::Error> {
    env_logger::init();

    let _ = trace_syscall().await?;

    let (client, connection) =
        tokio_postgres::connect("postgresql://guepard:1234@localhost:5432/pagila", NoTls).await?;

    tokio::spawn(async move {
        if let Err(e) = connection.await {
            eprintln!("connection error: {}", e);
        }
    });

    let mut syscall_file = OpenOptions::new()
        .append(true)
        .create(true)
        .open("data/syscalls.csv")
        .unwrap();

    let mut queries_file = OpenOptions::new().read(true).open("data/queries.txt");

    if let Err(e) = writeln!(syscall_file, "Test") {
        eprintln!("Couldn't write to file: {}", e);
    }

    info!("Waiting for Ctrl-C...");
    signal::ctrl_c().await?;
    info!("Exiting...");

    Ok(())
}
