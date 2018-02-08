# Library for emitting events in type-friendly way.
 
## Basic usage:
 
```js
class Foo {
 constructor() {
   this.eventNameChanged = new EventEmitter();
   this.eventNameCleared = new EventEmitter();
   this._name = '';
 }
 
 set name(value) {
   if (this._name === '') {
        this.eventNameCleared.emit();
   } else {
        this.eventNameChanged.emit(value);
   }
   
   this._name = value;
 }
}
 
const foo = new Foo();
 
foo.eventNameChanged.on(function(name) {
    console.log('foo.name is changed!, New name is', name);
});

foo.eventNameCleared.on(function() {
    console.log('foo.name is cleared!');
});
```
 
## Subscribe for few events simultaneously
 
```js
class Bar {
  constructor(foo) {
    // some() returns an instance of EventEmitter so you can call any of its methods
    EventEmitter.some(foo.eventNameChanged, foo.eventNameCleared).on(function () {
      console.log('eventNameChanged or eventNameCleared emitted');
    });
  }
}
```

## Unsubscribing from events

To avoid memory leaks you need to unsubscribe from **all** events, even from created with `once` method. 

Methods `on` and `once` return special object called `EventSubscription` and you can use it to unsubscribe from events 
and it designed to reduce boilerplate in controllers and components.
 
**Example of legacy controller with scope:**
```js
function HomeController($scope, foo) {
    var subscription = foo.eventNameChanged.on(this.doSmth.bind(this)); // this event returns subscription
    subscription.add(foo.eventNameCleared.on(this.doSmth.bind(this))); // add another event to existing subscription
    
    // attach scope to this subscription, subscription will be automaticaly disposed on scope $destroy event
    subscription.attachScope($scope); 
}
```

**Example of component controller:**
```js
function HomeComponentController() {
    this.subscription = this.foo.eventNameChanged.on(this.doSmth.bind(this)); // this event returns subscription
    this.subscription.add(this.foo.eventNameCleared.on(this.doSmth.bind(this))); // add another event to existing subscription
}

HomeComponentController.prototype.$onDestroy = function() {
    this.subscription.dispose();
}
```

Keep in mind that all methods of `EventSubscription` returns link to self, 
so you can reduce boilerplate code and use chaining of methods.

```js
// chaining
foo.eventNameChanged.on(this.doSmth)
    .add(foo.eventNameCleared.on(this.doSmth))
    .add(foo.eventUserChanged.on(this.doSmth))
    .attachScope($scope);
}
```

## Naming of events

It's quite important to have a convenient way to name events. The default rules is next: 

1. Name of events should be prefixed with "event", example:

    **Correct:** 
    > eventNameChanged
    
    > eventNameCleared
    
    **Wrong**:
    > changed
    
    > updated

2. Name of events should **contains** subject of event (**noun**):

    **Correct:** 
    > eventUserLogged
    
    > eventUserRemoved
    
    **Wrong**:
    > eventLogged
    
    > eventRemoved
    
3. Action should be in the past tense:

    **Correct:** 
    > eventUserLogged
    
    > eventUserRemoved
    
    **Wrong**:
    > eventUserLogin
    
    > eventUserRemove  


## Events on EventEmitter

EventEmitter has own events: 

* **eventHandlerAdded** - Emits when some handler was added to this event emitter
* **eventHandlerRemoved** - Emits when any handler was removed from this emitter
* **eventAllHandlersRemoved** - Emits when all handlers were removed from this emitter

All of this events are instances of EventEmitter, so you can use it as any other event.
