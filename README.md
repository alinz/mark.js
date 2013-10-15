#mark.js


Open Dependency Loader for JavaScript

I finally found a time to write about my new project. I has been uploaded to Github for sometime now but I wasn't able to sit and write a documentation for it.

So, let's cut the chase and get into the real exciting stuff.

Why a brand new Dependency Manager for Javascript?
--
I'm not sick and also don't have time to write, duplicate an existing library. The whole purpose of this library to solve one or many problem which I faced when I was working with couple of dependency libraries in JavaScript.

First, let me to tell you one thing, I like `Require.js`. I'm not going to replace it. What I'm going to do is solving couple of problem by using `Require.js`. I will try to explain the situation by use cases that I had in my project which led to creation of `mark.js`.

Use case 1
--
I involved with a project which was relying on `Backbone.js` heavily. The main developers were using `Require.js` for dependency manager and they broke down the entire project file system into couple of folders, such as view, model and collections. There views code became so complex because they wanted to support Desktop and mobile and couple of other devices. So they decided to break their views into multiple folders which each folder was contains specific architecture for that particular device. 

**NOTE:** Some devices are work better in `SVG`, rather than plain explain. So some of the view needs to be completely rewritten.

So now the chaos started to show up, `Require.js` started to show problem, not because of handling the files but for programmers. Now programmers need to maintain the dependencies. They had to tell the `Require.js` that I want that piece of code, so grab it from the following link. You might think that this is solvable by using `root url`, however, the programmer needs to write down the entire path so the code base becomes so complex. 

I thought there must be a way to solve this problem, so I started playing with `Require.js`. Well, the code is well-written, but it is complex to add new feature. Adding plugin was also not an option because of limited resources they had. So I start writing my own.

**NOTE:** I have been written multiple dependency manager for JavaScript, but all of those was for fun, you can take a look at those in my Github account, [include.js](https://github.com/alinz/include.js), and [LoadSequence.js](https://github.com/alinz/LoadSequence.js). `LoadSequence.js` is using [Topological Sorting](http://en.wikipedia.org/wiki/Topological_sorting) to create a sequence of load code, which I was fascinated.

You will see how I solved this by using `mark.js`.

Use case 2
--
I want developer to controller how they want to load the file, either using Ajax, Script Tag or even WebSocket. in their applications, not libraries. I know that you can add any feature to `Require.js` by using Plugin but, You have to remember that, it has learning curve. I want whoever using `mark.js`, just add their code, functionality and they can easily start writing their code. So in nutshell, you locked with their code base.

**NOTE:** have you thought about loading JavaScriot, css and template files using `websocket`? I think you can easily write one by using `mark.js`.

##Rise of mark.js
In nut shell, `mark.js` is just a dependency tracker. Basically, it knows that your code is require couple of other code before executing.

It doesn't know the path, or how to load it. This is developer responsibility. of course I will provide sample codes so sit back and enjoy the reading. :D

`mark.js` has set's of APIs which you can use to add, and extend its functioanlity. I tried hard to use signature approach, which using mark main function only to accepts all types of configurations. 

##API
#### 1: mark function
If you want to define your mark function, use the following code:


```javascript
mark("Sample1", [], function () {
	function say(message) {
		alert(message);
	}
	
	return { say: say };
});
```

In this example, we are creating a code that does't have any dependencies and expose itself as Sample1.

Let's make another example that uses the above code.

```javascript
mark("Sample2", ["Sample1"], function (Sample1) {
	Sample1.say("Sample2 is loaded.");
});
```

**NOTE:** it is absolutely fine if your mark function does't return any object. However, remember if another mark function depends on that mark function, you will get undefined variable.

**NOTE:** all the dependencies are injected to mark function in order. as an example,

```javascript
mark("Sample1", [], function () {
	return "This is Sample1";
});

mark("Sample2", [], function () {
	return "This is Sample2";
});

mark("Sample3", ["Sample1", "Sample2"], function (Sample1, Sample2) {
	alert(Sample1);
	alert(Sample2);
});
``` 

**NOTE:** if the number of dependencies for mark object becomes large, mark also inject dependencies as map to `this` pointer. as an example

```javascript
mark("Sample1", [], function () {
	return "This is Sample1";
});

mark("Sample2", [], function () {
	return "This is Sample2";
});

mark("Sample3", ["Sample1", "Sample2"], function () {
	var dependenciesMap = this;

	alert(dependenciesMap["Sample1"]);
	alert(dependenciesMap["Sample1"]);
});
``` 

#### 2: Adding library as SHIM 
There are couple of signature I found common in order to load global libraries such as `Backbone`, `jQuery`, etc… 


```javascript
mark("jQuery");
mark("underscore", "_");
mark("Backbone", ["jQuery", "underscore"]);
mark("Marionette", ["Backbone"], "Backbone");
```

**NOTE:** You don't see any path. You will see how `mark.js` help you finding the path.


So as you can see there are 4 types of defining a library as SHIM. Let' start explaining each of them.

1: Library that doesn't require any dependencies and the name of library exposed as global variable. As an example, `jQuery`. `jQuery` uses 2 signatures, `window.jQuery` and `window.$`. However, it is recommended to use jQuery in your application.

```
mark("<name of library>");
```

2: In second line, `underscore` library is another single depended library but it exposes itself to developer by `_`. So it needs to be registered to `mark.js` in such a way that as soon as `mark.js` loads that library load the proper variable for you. that the second signature comes into play. after defining name you have to tell `mark.js` loaded this library by that signature.

```
mark("<name of library>", "<global expose variable>");
```

3: The third example is `Backbone`. As you know, `Backbone` requires `underscore` and `jQuery`. However, in our example, the name is also exposed as variable in global scope. So I don't need to tell `mark.js`. The only thing that I need to tell `mark.js` is `Backbone`'s dependencies. So dependencies must passed as an array of string.

```
mark("<name of library>", ["<name of dependencies>"]);
```

4: The last signature for loading code as SHIM is library has a dependencies and exposed as a different name in global scope. For example, `Marionette.js` is a library that extends `Backbone`. So it attaches itself to `Backbone`. So we are writing the name, dependencies and adding `Backbone` as global variable.

```
mark("<name of library>", ["<name of dependencies>"], "<global expose variable>");
```

#### 3: Finding Path and Protocol
So far we talked about how to create mark function and define code as SHIM to mark. However, how the heck `mark.js` knows where the code is. This is the interesting part of `mark.js`.


The process is fairly simple. Everytime you requesting for a code, mark checks whether it has the object, if it's not, then check the path. if it does't find path, then it calls 2 functions, `mark:path` and `mark:protocol`.

**NOTE:** These functions need to be defined by developer.  

**NOTE:** Before jump into each function's details, in order to add/extend function to `mark.js`, check the following sequence.

```javascript
mark("name of your function", function () {

});
``` 

**Note:** There are 2 reserved function's names that belong to `mark.js`.

##### What is `mark:path`?
This function is called if `mark.js` can't find any path for your requested module. `mark.js` passes requested module's name to that function as an argument and expects a path from it. This function should be in synchronize way. It means that you should not use any async call inside it to get the result. I'm planning to add this in feature.

The name of function that you have to register is "mark:path".

```javascript
mark("mark:path", function (name) {
	if (name == "Backbone") {
		return "js/library/backbone.js";
	}
	
	throw "Module '" + name + "' is not found.";
});
``` 

This is very silly way of defining `make:path` function. I will show you how to make it more generic.

##### What is `mark:protocol`?
This function is called right after `mark:path`. `mark.js` is passing name and path of requested module in order to find out how to load that module. This function needs to be implemented as synchronize way. This function needs to return a name of method which responsible to load the content.

```javascript
mark("mark:protocol", function (name, path) {
	if (path.indexOf(".js")) {
		return "scriptTag";
	}
	
	throw "Module '" + name + "' is not recognized as valid type.";
});
``` 

#### What is `custom function`?
Once you setup those two function, it's time to work on actual work. Let's make an example. Imagine that mark:protocol is returning scriptTag. So now it is time to create a `custom function` with name of  `scriptTag`.

```javascript
mark("protocol:scriptTag", function (path) {
	...
});
```

As you can see every time a module is selected to be loaded as `scriptTag` or any other protocol, path will be passed to as only argument.

Now the question is, how does `mark.js` know that the requested file has been loaded. Since `mark.js` has access to all custom registered functions, it injects two methods, `done` and `failed`, to `this` pointer. So you can write ajax or any asynchronied functions and method to implement your code. So let's complete the above example.

```javascript
mark("protocol:scriptTag", function (path) {
    var that = this,
        script = document.createElement('script');

    script.async = true;
    script.setAttribute('type', 'text/javascript');

    //IE callback specific
    script.onreadystatechange = function () {
        if (this.readyState == 'loaded') {
            that.done();
        }
    };

    //other browsers callback
    script.onload = function () {
        that.done();
    };

    script.onerror = function () {
        console.log("loading '" + path + "' caused a problem.");
        that.failed();
    };

    script.src = path;
    document.documentElement.appendChild(script);
});
```

I think I don't need to explain the code. Code itself is explanatory. 

Let's make another example for ajax protocol.

**NOTE:** You can't use jQuery ajax call. I know it sounds not COOL, but how would you load jQuery itself with jQuery? Huh???? And I think we depends on jQuery ajax so much that we forgot how easy it is to create a ajax. To me world of IE 6 and 7 are long gone. It might sounds harsh but if you are still using ie 6 and 7, you better off this page quickly. 

```javascript
function markAjaxFunction(path, fn) {
    var xhr;
    if (window.XMLHttpRequest) {
        xhr = new XMLHttpRequest();
    }
    if (xhr === false) {
        return null;
    }

    path += '?' + new Date().getTime();

    xhr.open('GET', path, true);
    xhr.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status > 199 && this.status < 300) {
                //eval(xhr.responseText);
                //that.done();
                fn(xhr.responseText);
            } else if (this.status > 399) {
                fn({ error: true });
            }
        }
    };

    xhr.send();
    return xhr;
}

mark("protocol:ajaxScript", function (path) {
    var that = this;
    markAjaxFunction(path, function (message) {
        if (message.error) {
            console.log("The following path is not found: " + path);
            that.failed();
        }
        eval(message);
        that.done();
    });
});
```

So now why I called it `ajaxScript` but not `ajax`? well, as I mentioned before, this is not a javascript loader. This is a dependency loader. It means that you can load any types of file.and by now you know that ajax can be used to load any contents that can be transferred as text.

So, what else I can download and inject to my code? As you may notice, Templates. These days, templates are all over our web app. We are kind of proud that we moved rendering to client rather than in server. So how can I modify the existing code to accept and load template for me? It is easy. as you may notice by now, `markAjaxFunction` is a generic ajax code. So here's template code which uses same function.

```javascript
mark("protocol:template", function (path) {
    var that = this;
    markAjaxFunction(path, function (templateString) {
        if (message.error) {
            console.log("The following path is not found: " + path);
            that.failed();
        }
        that.done(templateString);
    });
});
``` 

I simply used the same function and get the response as text. Now the interesting part is I can compile it before during the load. let's modified the `that.done(templateString)`.

So instead of the above code, I'm going to use `underscore.js` tempting system.

```javascript
mark("protocol:template", function (path) {
    var that = this;
    markAjaxFunction(path, function (templateString) {
        if (message.error) {
            console.log("The following path is not found: " + path);
            that.failed();
        }
        that.done(_.template(templateString);
    });
});
``` 

So now when I request a template, mark will cache and return compiled template code.

**NOTE:** WHAT??? you can use underscore but you can't use jQuery ajax to load the content? Just take a deep breath and then start reading…

Well, this is the most confusing part of `mark.js`. You have to remember that script are loaded first before you can start loading templates. How can I do that. Well, we have to write a bootstrap for it. Usually, when your app is starting up, you want to load couple of important module is loaded before you are doing anything else. In other hand, consider this as your `main` function of your app.

Let's take a look at the following example.

```javascript
mark("Main", ["underscore", "jQuery", "MyApp"], function (_, $, MyApp) {
	
	//do some initialization
	
	MyApp.start();
	
});
```

It is that simple. :D















