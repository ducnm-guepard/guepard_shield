#![no_std]

#[derive(Clone, Copy, Debug)]
#[repr(C)]
pub struct SyscallInfo {
    pub syscall_nr: u32,
    pub pid: u32,
}
