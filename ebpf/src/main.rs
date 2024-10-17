#![no_std]
#![no_main]
#![allow(static_mut_refs)]

#[allow(non_upper_case_globals)]
#[allow(non_snake_case)]
#[allow(non_camel_case_types)]
#[allow(dead_code)]
mod bindings;

use core::str::from_utf8_unchecked;

use aya_ebpf::{
    helpers::bpf_get_current_comm,
    macros::{map, tracepoint},
    maps::RingBuf,
    programs::TracePointContext,
    EbpfContext,
};

#[map]
static mut SYSCALLS: RingBuf = RingBuf::with_byte_size(256 * 1024, 0);

#[tracepoint]
pub fn guepard_shield(ctx: TracePointContext) -> u32 {
    match unsafe { try_trace_syscall(ctx) } {
        Ok(ret) => ret,
        Err(ret) => ret,
    }
}

unsafe fn try_trace_syscall(ctx: TracePointContext) -> Result<u32, u32> {
    let comm = bpf_get_current_comm().unwrap();
    let command = from_utf8_unchecked(&comm);
    let event = ctx
        .read_at::<bindings::trace_event_raw_sys_enter>(0)
        .unwrap();

    if command.contains("postgres") {
        let info = common::SyscallInfo {
            pid: ctx.tgid(),
            syscall_nr: event.id as u32,
        };
        let _ = SYSCALLS.output(&info, 0);
    }

    Ok(0)
}

#[panic_handler]
fn panic(_info: &core::panic::PanicInfo) -> ! {
    unsafe { core::hint::unreachable_unchecked() }
}
