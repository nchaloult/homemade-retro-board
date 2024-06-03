# Homemade Retro Board

## Development

```sh
npm run dev
```

### Database-related chores

You can poke around the database and run queries with the SQLite CLI.

```sh
sqlite3 sqlite.db

# Run queries.
> select * from entries where board_id = 1 order by `order` desc;
# View schema-related info.
> pragma table_info(entries);
# Find out what else you can do.
> .help
```

Seeding your local database is also done with the same CLI.

```sh
sqlite3 sqlite.db < seed.sql
```

## Deployment

To deploy whatever code is currently sitting in this repo's root directory, run
the following.

```sh
fly deploy
```

## Production environment management

### Database-related chores

You can pull down the production database file with Fly's wrapper around SFTP.

```sh
fly sftp get /data/sqlite.db
```

Uploading a local file to the production volume is a bit weird. You use Fly's
SFTP wrapper again, which has a strange command-line interface.

```sh
fly sftp shell

>> put <path-to-local-file> <path-to-remote-destination>
# Example: >> put sqlite.db /data/sqlite.db

# Exit with Ctrl+D
```

When the database file is changed, I think SQLite somehow flips the entire
database into a read-only mode? Not sure if it copies all the contents into
memory or something, but anyway... subsequent writes are blocked with the
`SQLITE_READONLY_DBMOVED` error code, and your new changes aren't reflected.

The only way to load in those new changes is with an application restart, I
believe.

```sh
fly apps restart
```

### Misc. helpful, unrelated commands

```sh
fly logs
fly ssh console
```

In [`fly.toml`](fly.toml), the app is configured to be able to scale to zero
instances. If you're trying to ssh in and it's timing out, no instances might be
spun up. You can check this by running the following.

```sh
fly status
```

If the instance is down/stopped, and you want to do something with it, send it a
request, and it'll come alive.

```sh
curl https://homemade-retro-board.fly.dev
```
