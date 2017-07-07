# api-gateway

> This is a somewhat basic example of a real world node app

Although this is pretty basic, it is close to something
we currently run in production. i.e., this is a real world use case of node

The primary purpose of this is to see what kind of performance regressions
TurboFan brings to the table (if any).

The benchmark requires a redis instance.
If `docker` is installed, you can spin up a redis instance with the following command:

```bash
$ docker run -d --name redis -p "6379:6379" redis
# after the benchmark, to remove the container, run
$ docker rm -f redis
```

Then, run the benchmark script

```bash
$ npm install
$ npm run bench
# or, to run using a different node binary
$ /path/to/node bin/bench.js
```

## Author

Evan Lucas

## Contributions

Contributions are very welcome. Please help make this better.

## License

MIT
