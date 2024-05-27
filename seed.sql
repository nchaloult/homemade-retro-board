INSERT INTO boards (external_id, name) VALUES ("d4tLgQ89hG", "Foo Bar");

INSERT INTO columns (name, `order`, board_id) VALUES (
    "What went well",
    0.0,
    1
);
INSERT INTO columns (name, `order`, board_id) VALUES (
    "What didn't go well",
    1.0,
    1
);
INSERT INTO columns (name, `order`, board_id) VALUES (
    "What should we change",
    2.0,
    1
);
INSERT INTO columns (name, `order`, board_id) VALUES (
    "Kudos",
    3.0,
    1
);

INSERT INTO entries (content, author_display_name, `order`, board_id, column_id) VALUES (
    "Lorem ipsum dolor sit amet",
    "anonymoose",
    0.0,
    1,
    1
);
INSERT INTO entries (content, author_display_name, `order`, board_id, column_id) VALUES (
    "And one more piece of feedback from Anonymoose",
    "anonymoose",
    0.0,
    1,
    3
);
INSERT INTO entries (content, author_display_name, `order`, board_id, column_id) VALUES (
    "The quick brown fox jumps over the lazy dog",
    "anonymoose",
    1.0,
    1,
    1
);
INSERT INTO entries (content, author_display_name, `order`, board_id, column_id) VALUES (
    "The cow jumped over the moon",
    "Nick",
    2.0,
    1,
    1
);

INSERT INTO comments (content, author_display_name, `order`, board_id, column_id, entry_id) VALUES (
    "Yes",
    "Paul",
    0.0,
    1,
    1,
    4
);