use std::ops::Deref;

use aya::maps::RingBuf;
use chrono::Local;
use common::SyscallInfo;
use tokio::io::unix::AsyncFd;

use crate::ebpf::attach_bpf;

pub async fn trace_syscall() -> Result<(), anyhow::Error> {
    let mut bpf = attach_bpf()?;
    let ring_buf = RingBuf::try_from(bpf.map_mut("SYSCALLS").unwrap()).unwrap();
    let mut poll = AsyncFd::new(ring_buf)?;

    loop {
        let mut guard = poll.readable_mut().await.unwrap();
        let ring_buf = guard.get_inner_mut();
        while let Some(item) = ring_buf.next() {
            let now = Local::now();
            let info = unsafe { &*(item.deref().as_ptr() as *const SyscallInfo) };
            log::info!("{}: call {} at {}", info.pid, info.syscall_nr, now);
        }
        guard.clear_ready();
    }
}
