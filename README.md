# ringo-maps-0.1.1
Important changes made:
- Project uses Vuetify instead of Vue Bootstrap
- db.json have the data of the 3 cities used as example, but action and payload aren't because json-server couldn't create endpoints for them. So now the content of payload is the city object itself.
- Property '_id' was changed to 'id' to be used by json-server as UUID.

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Test
    .env.sample => env.local



~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

## Project setup
```
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
