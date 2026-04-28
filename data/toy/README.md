# Toy Data

Toy data files are **intentionally not committed** to Git. The entire
directory is gitignored (`.gitignore` rule: `/data/toy/**`), with only the
`.gitkeep` file preserved to retain the directory structure.

## Generation

All toy data files are created at runtime by the `rcb create-toy-data` command:

```bash
rcb create-toy-data
```

## CI

The CI smoke workflow automatically runs `rcb create-toy-data` before executing
tests, ensuring toy data is always available in CI without being stored in the
repository.

## Generated Files

| File | Approx. Size | Description |
|---|---|---|
| `toy_expression.h5ad` | ~320 KB | Toy expression matrix (AnnData) |
| `toy_labels.parquet` | ~4 KB | Toy label annotations |
| `toy_manifest.json` | <1 KB | Manifest/metadata for toy dataset |
