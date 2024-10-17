mod build_ebpf;
mod build;
mod run;
mod bindgen;

use std::process::exit;

use clap::Parser;

#[derive(Debug, Parser)]
pub struct Options {
    #[clap(subcommand)]
    command: Command,
}

#[derive(Debug, Parser)]
enum Command {
    BuildEbpf(build_ebpf::Options),
    Build(build::Options),
    Run(run::Options),
    Bindgen
}

fn main() {
    let opts = Options::parse();

    use Command::*;
    let ret = match opts.command {
        BuildEbpf(opts) => build_ebpf::build_ebpf(opts),
        Run(opts) => run::run(opts),
        Build(opts) => build::build(opts),
        Bindgen => bindgen::generate()
    };

    if let Err(e) = ret {
        eprintln!("{e:#}");
        exit(1);
    }
}