preloader.js, a cross-browser library for preloading your image resources
========

Why ?
-----
In current browsers, resources are not downloaded when they're not used,
which is good for performance. However, it means that sometimes, in a web
application where some parts are only displayed on demand, there can
be a visible glitch during the first download of a resource.

The fix is easy: you have to download the resource in background. Well,
this is easy if you only have one resource, but if you have plenty,
problems occurs:
* you have to be careful to not download every resources at the same time
* using JavaScript to preload resources whereas using CSS to
actually use your resources leads to out of sync files

This library is a possible solution:
* it parses a CSS file and downloads any resource it finds
* easy to set up

How ?
-----
# Insert the `lib.preloader.js` script.
# add a `class="preload"` on the style you want to preload
# call `preloader.init()`. Usually, we do this later, like after the
`onload` event, so that it doesn't prevent the application to load
fast.

There is more than one way to do it
----------
`preloader.js` support two ways of preloading: JavaScript and CSS.

### JavaScript mode
This is the default, and it works quite simply: it loads one file after
another.

In this mode, there is a problem in Internet Explorer when it encounters
a 404 error, because we don't get an event in this case. Therefore
we set up a `setTimeout` of 999ms by default to handle this case. The
timeout can be changed by passing a setting object to `init` :

```javascript
preloader.init({ errorDelay: 2000 });
```

### CSS mode
This mode is disabled by default. To use it, you have to modify the
`start` function, comment the call to `loadImgsWithAjax` and uncomment
the call to `loadImgsWithCss`. You also have to include the
[`cssrule.js`](https://github.com/Orange-OpenSource/cssrule.js) library as well.

Basically, this inserts a CSS rule with all resources inside a
`content` property, and we let the browser do the rest. I found that
when there are too many resources, this is not so good because it
impacts performance.

This mode was less tested so there could be some problems.
