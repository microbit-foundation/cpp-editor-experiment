#!/bin/bash

files=$(cd pack;find . -print)
$(cd pack;../wasm-package pack archive $files)
$(brotli -Z -f -j pack/archive -o root.pack.br)
