# tree-sitter-alloy

A [tree-sitter](https://tree-sitter.github.io/) grammar for the
[Alloy 6](https://alloytools.org/) formal specification language.

Covers the full Alloy 6 syntax including temporal operators (`always`,
`eventually`, `until`, `since`, etc.), `var` fields, and trace-style `run`
commands.

## Usage

### Neovim

Add the parser to your tree-sitter config via
[nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter).
A `highlights.scm` query is included in `queries/`.

### Emacs

Use with [emacs-tree-sitter](https://github.com/emacs-tree-sitter/elisp-tree-sitter)
or the built-in `treesit` module (Emacs 29+). File type: `*.als`.

### Helix

Place the compiled grammar and `queries/highlights.scm` in
`runtime/grammars/sources/alloy/` and add an entry to `languages.toml`.

## Development

```bash
npm install
npx tree-sitter generate
npx tree-sitter test
```

### Testing

The test corpus (`test/corpus/`) contains 83 tests covering all grammar rules:
declarations, expressions, temporal operators, literals, names, and comments.

The grammar has also been validated against 331 real-world `.als` files from the
Alloy examples, [AlloyTools/models](https://github.com/AlloyTools/models), and
other public repositories (100% parse rate).

## References

- [Alloy documentation](https://alloy.readthedocs.io/en/latest/)
- Daniel Jackson, *Software Abstractions* (MIT Press)
- [AlloyTools](https://github.com/AlloyTools/org.alloytools.alloy)

## License

[MIT](LICENSE)
