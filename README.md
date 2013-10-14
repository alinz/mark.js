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

###API
##### 1: Adding SHIM libraries
There are couple of signature I found common in order to load global libraries such as `Backbone`, `jQuery`, etc… 


```javascript
mark("jQuery");
mark("underscore", "_");
mark("Backbone", ["jQuery", "underscore"]);
mark("Marionette", ["Backbone"], "Backbone");
```




