use std::{
    collections::HashMap,
    fs::File,
    sync::{Arc, Mutex},
};

use common::SyscallInfo;
use csv::{Reader, Writer};

pub struct UniqueAppender {
    writer: Writer<File>,
    path: String,
    count: i32,
}

impl UniqueAppender {
    pub fn new(path: &str) -> Self {
        let file = File::options().append(true).open(path).unwrap();
        let writer = Writer::from_writer(file);

        Self {
            writer,
            path: path.to_string(),
            count: 0,
        }
    }

    fn exists(&mut self, syscall_str: &String) -> bool {
        let file = File::options().read(true).open(self.path.as_str()).unwrap();
        let mut reader = Reader::from_reader(file);

        for record in reader.records() {
            if record
                .unwrap()
                .get(0)
                .is_some_and(|s| s.eq_ignore_ascii_case(syscall_str.as_str()))
            {
                return true;
            }
        }
        return false;
    }

    pub fn append(
        &mut self,
        syscalls: Arc<Mutex<Vec<SyscallInfo>>>,
        label: &str,
    ) -> Result<(), Box<dyn std::error::Error>> {
        let syscalls_lock = syscalls.lock().unwrap();

        if syscalls_lock.len() == 0 {
            return Ok(());
        }

        let mut pid_counts: HashMap<u32, usize> = HashMap::new();
        for syscall in syscalls_lock.iter() {
            *pid_counts.entry(syscall.pid).or_insert(0) += 1;
        }

        let main_pid = pid_counts
            .iter()
            .max_by_key(|&(_, count)| count)
            .map(|(&pid, _)| pid)
            .unwrap_or_default();

        let syscall_nrs: Vec<u32> = syscalls_lock
            .iter()
            .filter(|syscall| syscall.pid == main_pid)
            .map(|syscall| syscall.syscall_nr)
            .collect();

        let syscall_str = format!("{:?}", syscall_nrs);

        if self.exists(&syscall_str) {
            return Ok(());
        }

        let _ = self.writer.write_record(&[syscall_str, label.to_owned()]);
        self.writer.flush()?;
        self.count += 1;

        log::info!("Appended {} records!", self.count);

        Ok(())
    }
}
