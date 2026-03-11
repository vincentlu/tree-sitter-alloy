# tree-sitter-alloy

A [tree-sitter](https://tree-sitter.github.io/) grammar for the
[Alloy 6](https://alloytools.org/) formal specification language.

Covers the full Alloy 6 syntax including temporal operators (`always`,
`eventually`, `until`, `since`, etc.), `var` fields, and trace-style `run`
commands.

## Usage

### Emacs (29+)

Add to your config:

```elisp
(add-to-list 'treesit-language-source-alist
             '(alloy "https://github.com/vincentlu/tree-sitter-alloy"))
```

Then run `M-x treesit-install-language-grammar` and select `alloy`.

For older tree-sitter library versions, use the `abi-13` or `abi-14` tags:

```elisp
(add-to-list 'treesit-language-source-alist
             '(alloy "https://github.com/vincentlu/tree-sitter-alloy" "abi-14"))
```

| Tag      | ABI version | tree-sitter CLI |
|----------|-------------|-----------------|
| `abi-13` | 13          | 0.20.6          |
| `abi-14` | 14          | 0.24.7          |
| `main`   | 15          | 0.26.6          |

### Neovim

Add the parser to your tree-sitter config via
[nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter).
A `highlights.scm` query is included in `queries/`.

### Helix

Place the compiled grammar and `queries/highlights.scm` in
`runtime/grammars/sources/alloy/` and add an entry to `languages.toml`.

## Development

```bash
npm install
npx tree-sitter generate
npx tree-sitter test
```

## Testing

The test corpus (`test/corpus/`) contains 83 tests covering all grammar rules:
declarations, expressions, temporal operators, comparisons, literals, names,
precedence, and quantifiers.

The grammar has also been validated against 331 real-world `.als` files from the
Alloy examples, [AlloyTools/models](https://github.com/AlloyTools/models), and
other public repositories (100% parse rate).

## References

- [Alloy documentation](https://alloy.readthedocs.io/en/latest/)
- Daniel Jackson, *Software Abstractions* (MIT Press)
- [AlloyTools](https://github.com/AlloyTools/org.alloytools.alloy)

## License

[MIT](LICENSE)
