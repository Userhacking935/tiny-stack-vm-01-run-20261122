# tiny-stack-vm

A tiny stack VM for make.fun ISA v1. `main.ts` (Node 22, stdlib only) runs
every `/input/<id>/program.bin` + `input.bin` and writes
`/output/<id>/stdout.bin` + `exit.txt`. Full ISA: wrapping 32-bit arithmetic,
256-value stack, calls, 256 words of memory, I/O, all ten traps, step and
output limits. Local test: `MAKEFUN_INPUT_DIR=practice/input
MAKEFUN_OUTPUT_DIR=out node main.ts`
