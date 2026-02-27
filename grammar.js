/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Tree-sitter grammar for Alloy 6
// Based on the authoritative CUP parser (Alloy.cup) and lexer (Alloy.lex)

module.exports = grammar({
  name: "alloy",

  extras: $ => [
    /\s/,
    $.line_comment,
    $.block_comment,
  ],

  word: $ => $.name,

  conflicts: $ => [
    // command ref vs next paragraph
    [$.command],
    // scope: "for 5 State" is typescope, not "for 5" + new paragraph
    [$.scope, $.type_scope_number],
    // name can reduce to name_list or qual_name depending on context
    [$.name_list, $.qual_name],
    // arrow multiplicity: expr before lone/one/some -> needs GLR forking
    [$.arrow_expression, $.block_expression],
    [$.arrow_expression, $.let_decl],
  ],

  precedences: $ => [
    // From CUP grammar precedence declarations (lowest to highest)
    [
      'seq',          // ; (trace sequence)
      'or',           // || or
      'iff',          // <=> iff
      'implies',      // => implies
      'and',          // && and
      'temp_binary',  // until since releases triggered
      'not',          // ! not + temporal unary
      'compare',      // = != in !in < > <= >= binary comparisons
      'multiplicity', // no some lone one set seq (prefix tests)
      'shift',        // << >> >>>
      'plus_minus',   // + -
      'cardinality',  // # (cardinality prefix)
      'override',     // ++
      'intersect',    // &
      'arrow',        // -> and multiplicity arrows
      'domain',       // <:
      'range',        // :>
      'bracket',      // [...]
      'dot',          // .
      'unop',         // ~ ^ * (closures/transpose)
      'prime',        // ' (postfix prime)
      'primary',      // atoms
    ],
  ],

  rules: {
    source_file: $ => repeat($._paragraph),

    _paragraph: $ => choice(
      $.module_decl,
      $.open_decl,
      $.sig_decl,
      $.fact_decl,
      $.pred_decl,
      $.fun_decl,
      $.assert_decl,
      $.command,
      $.enum_decl,
      $.let_decl,
    ),

    // ---- Module declaration ----
    module_decl: $ => seq(
      'module',
      field('name', $.qual_name),
      optional(seq('[', $.name_list_exact, ']')),
    ),

    // ---- Open (import) ----
    open_decl: $ => seq(
      optional($.visibility),
      'open',
      field('name', $.qual_name),
      optional(seq('[', optional($.sig_ref_list), ']')),
      optional(seq('as', field('alias', $.name))),
    ),

    // ---- Enum ----
    enum_decl: $ => seq(
      optional($.visibility),
      'enum',
      field('name', $.name),
      '{',
      optional($.name_list),
      '}',
    ),

    // ---- Signature ----
    sig_decl: $ => seq(
      repeat($.sig_qualifier),
      'sig',
      field('names', $.name_list),
      optional($.sig_extension),
      '{',
      optional($.sig_body),
      '}',
      optional($.block_expression),
    ),

    sig_qualifier: $ => choice(
      'abstract',
      'lone',
      'one',
      'some',
      'private',
      'var',
    ),

    sig_extension: $ => choice(
      seq('extends', $.sig_ref),
      seq('in', $.sig_ref_union),
    ),

    sig_body: $ => seq(
      $.field_decl,
      repeat(seq(',', $.field_decl)),
      optional(','),
    ),

    field_decl: $ => seq(
      optional('var'),
      optional('private'),
      optional('disj'),
      $.name_list,
      ':',
      optional('disj'),
      $._expression,
    ),

    // ---- Fact ----
    fact_decl: $ => seq(
      'fact',
      optional(field('name', choice($.name, $.string))),
      $.block_expression,
    ),

    // ---- Predicate ----
    pred_decl: $ => seq(
      optional($.visibility),
      'pred',
      optional(seq($.sig_ref, '.')),
      field('name', $.name),
      optional(choice(
        seq('(', optional($.decl_list), ')'),
        seq('[', optional($.decl_list), ']'),
      )),
      $.block_expression,
    ),

    // ---- Function ----
    fun_decl: $ => seq(
      optional($.visibility),
      'fun',
      optional(seq($.sig_ref, '.')),
      field('name', $.name),
      optional(choice(
        seq('(', optional($.decl_list), ')'),
        seq('[', optional($.decl_list), ']'),
      )),
      ':',
      field('return_type', $._expression),
      $.block_expression,
    ),

    // ---- Assert ----
    assert_decl: $ => seq(
      'assert',
      optional(field('name', choice($.name, $.string))),
      $.block_expression,
    ),

    // ---- Let (macro) ----
    let_decl: $ => seq(
      optional($.visibility),
      'let',
      field('name', $.name),
      optional(choice(
        seq('(', optional($.name_list), ')'),
        seq('[', optional($.name_list), ']'),
      )),
      choice(
        $.block_expression,
        seq('=', $._expression),
      ),
    ),

    // ---- Command (run/check) ----
    command: $ => seq(
      optional(seq(field('label', $.name), ':')),
      choice('run', 'check'),
      optional(field('name', $.qual_name)),
      optional(field('body', $.block_expression)),
      optional($.scope),
      optional($.expect_clause),
    ),

    scope: $ => seq(
      'for',
      choice(
        seq($.number, optional(seq('but', $.typescope_list))),
        $.typescope_list,
      ),
    ),

    typescope_list: $ => seq(
      $.typescope,
      repeat(seq(',', $.typescope)),
    ),

    typescope: $ => seq(
      optional('exactly'),
      $.type_scope_number,
      $.scope_sig_ref,
    ),

    type_scope_number: $ => choice(
      seq($.number, '..', optional($.number)),
      $.number,
    ),

    scope_sig_ref: $ => choice(
      $.qual_name,
      'univ',
      'Int',
      'int',
      'none',
      'String',
      'steps',
      'seq',
    ),

    expect_clause: $ => seq('expect', $.number),

    // ---- Shared helpers ----

    visibility: $ => 'private',

    decl_list: $ => seq(
      $.decl,
      repeat(seq(',', $.decl)),
    ),

    decl: $ => seq(
      optional('disj'),
      $.name_list,
      ':',
      optional('disj'),
      $._expression,
    ),

    name_list: $ => seq(
      $.name,
      repeat(seq(',', $.name)),
    ),

    name_list_exact: $ => seq(
      $._name_or_exactly,
      repeat(seq(',', $._name_or_exactly)),
    ),

    _name_or_exactly: $ => choice(
      $.name,
      seq('exactly', $.name),
    ),

    sig_ref: $ => choice(
      $.qual_name,
      'univ',
      'Int',
      'none',
      'String',
      'steps',
      seq('seq', '/', 'Int'),
    ),

    sig_ref_list: $ => seq(
      $.sig_ref,
      repeat(seq(',', $.sig_ref)),
    ),

    sig_ref_union: $ => seq(
      $.sig_ref,
      repeat(seq('+', $.sig_ref)),
    ),

    // ---- Expressions ----

    _expression: $ => choice(
      $.seq_expression,
      $.or_expression,
      $.iff_expression,
      $.implies_expression,
      $.and_expression,
      $.temporal_binary_expression,
      $.unary_expression,
      $.compare_expression,
      $.multiplicity_expression,
      $.shift_expression,
      $.plus_minus_expression,
      $.cardinality_expression,
      $.override_expression,
      $.intersect_expression,
      $.arrow_expression,
      $.domain_expression,
      $.range_expression,
      $.dot_expression,
      $.box_join_expression,
      $.closure_expression,
      $.prime_expression,
      $.quantified_expression,
      $.let_expression,
      $._primary_expression,
    ),

    // ; (trace sequence) - lowest precedence, right-assoc
    seq_expression: $ => prec.right('seq', seq(
      $._expression,
      ';',
      $._expression,
    )),

    // || or
    or_expression: $ => prec.left('or', seq(
      $._expression,
      choice('||', 'or'),
      $._expression,
    )),

    // <=> iff
    iff_expression: $ => prec.left('iff', seq(
      $._expression,
      choice('<=>', 'iff'),
      $._expression,
    )),

    // => implies (right-assoc, with optional else for if-then-else)
    implies_expression: $ => prec.right('implies', seq(
      $._expression,
      choice('=>', 'implies'),
      $._expression,
      optional(seq('else', $._expression)),
    )),

    // && and
    and_expression: $ => prec.left('and', seq(
      $._expression,
      choice('&&', 'and'),
      $._expression,
    )),

    // Temporal binary: until since releases triggered
    temporal_binary_expression: $ => prec.left('temp_binary', seq(
      $._expression,
      field('operator', choice('until', 'since', 'releases', 'triggered')),
      $._expression,
    )),

    // Unary prefix: ! not always eventually after before historically once
    unary_expression: $ => prec('not', seq(
      field('operator', choice(
        '!', 'not',
        'always', 'eventually', 'after', 'before', 'historically', 'once',
      )),
      $._expression,
    )),

    // Binary comparisons
    compare_expression: $ => prec.left('compare', seq(
      $._expression,
      field('operator', choice(
        '=', '!=', 'in', '!in',
        '<', '>', '<=', '>=', '=<',
        '!<', '!>', '!<=', '!>=',
      )),
      $._expression,
    )),

    // Multiplicity tests (unary prefix, higher precedence than binary compare)
    multiplicity_expression: $ => prec('multiplicity', seq(
      field('operator', choice('no', 'some', 'lone', 'one', 'set', 'seq')),
      $._expression,
    )),

    // Shift: << >> >>>
    shift_expression: $ => prec.left('shift', seq(
      $._expression,
      field('operator', choice('<<', '>>>', '>>')),
      $._expression,
    )),

    // Plus/minus: + -
    plus_minus_expression: $ => prec.left('plus_minus', seq(
      $._expression,
      field('operator', choice('+', '-')),
      $._expression,
    )),

    // Cardinality/cast: # expr, int expr, sum expr (unary prefix)
    // CUP grammar: NumUnopExpr level, between MulExpr and OverrideExpr
    cardinality_expression: $ => prec('cardinality', seq(
      field('operator', choice('#', 'int', 'sum')),
      $._expression,
    )),

    // Override: ++
    override_expression: $ => prec.left('override', seq(
      $._expression,
      '++',
      $._expression,
    )),

    // Intersection: &
    intersect_expression: $ => prec.left('intersect', seq(
      $._expression,
      '&',
      $._expression,
    )),

    // Arrow: -> with optional multiplicity annotations
    // The CUP grammar's CompFilter merges multiplicity keywords with ->
    arrow_expression: $ => prec.right('arrow', seq(
      $._expression,
      optional(field('left_mult', choice('some', 'one', 'lone'))),
      '->',
      optional(field('right_mult', choice('some', 'one', 'lone'))),
      $._expression,
    )),

    // Domain restriction: <:
    domain_expression: $ => prec.left('domain', seq(
      $._expression,
      '<:',
      $._expression,
    )),

    // Range restriction: :>
    range_expression: $ => prec.left('range', seq(
      $._expression,
      ':>',
      $._expression,
    )),

    // Box join: expr[exprs]
    box_join_expression: $ => prec.left('bracket', seq(
      $._expression,
      '[',
      optional($.expr_list),
      ']',
    )),

    // Dot join: .
    dot_expression: $ => prec.left('dot', seq(
      $._expression,
      '.',
      $._expression,
    )),

    // Closure/transpose: ~ ^ *
    closure_expression: $ => prec('unop', seq(
      field('operator', choice('~', '^', '*')),
      $._expression,
    )),

    // Prime: postfix '
    prime_expression: $ => prec('prime', seq(
      $._expression,
      "'",
    )),

    // ---- Quantified expressions ----
    quantified_expression: $ => prec.right('not', seq(
      choice('all', 'no', 'some', 'lone', 'one', 'sum'),
      $.decl_list,
      choice(
        seq('|', $._expression),
        $.block_expression,
      ),
    )),

    // ---- Let expression ----
    let_expression: $ => prec.right('not', seq(
      'let',
      $.let_binding,
      choice(
        seq('|', $._expression),
        $.block_expression,
      ),
    )),

    let_binding: $ => seq(
      $.name,
      '=',
      $._expression,
      repeat(seq(',', $.name, '=', $._expression)),
    ),

    // ---- Primary expressions ----
    _primary_expression: $ => prec('primary', choice(
      $.number,
      $.string,
      $.qual_name,
      $.at_name,
      $.this_expr,
      $.iden_expr,
      $.none_expr,
      $.univ_expr,
      $.int_expr,
      $.paren_expression,
      $.block_expression,
      $.set_comprehension,
    )),

    this_expr: $ => 'this',
    iden_expr: $ => 'iden',
    none_expr: $ => 'none',
    univ_expr: $ => 'univ',
    int_expr: $ => 'Int',

    at_name: $ => seq('@', $.name),

    paren_expression: $ => seq('(', $._expression, ')'),

    block_expression: $ => seq(
      '{',
      repeat($._expression),
      '}',
    ),

    set_comprehension: $ => seq(
      '{',
      $.decl_list,
      '|',
      $._expression,
      '}',
    ),

    expr_list: $ => seq(
      $._expression,
      repeat(seq(',', $._expression)),
    ),

    // ---- Qualified names ----
    qual_name: $ => seq(
      optional(choice(
        seq('this', '/'),
        seq('seq', '/'),
      )),
      $.name,
      repeat(seq('/', $.name)),
    ),

    // ---- Terminals ----
    name: $ => /[a-zA-Z_\$][a-zA-Z0-9_\$"]*/,

    number: $ => choice(
      /[0-9][0-9_]*/,             // decimal (with optional underscores)
      /0x([0-9A-Fa-f_])+/,       // hexadecimal
      /0b[01_]+/,                 // binary
    ),

    string: $ => /"([^"\\]|\\.)*"/,

    line_comment: $ => token(choice(
      seq('//', /[^\r\n]*/),
      seq('--', /[^\r\n]*/),
    )),

    block_comment: $ => token(seq(
      '/*',
      /[^*]*\*+([^/*][^*]*\*+)*/,
      '/',
    )),
  },
});
