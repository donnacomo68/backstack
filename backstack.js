/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * Date: 2/8/12
 * Time: 4:38 PM
 *
 */

(function (root, factory) {
    // Set up BackStack appropriately for the environment.
    if (typeof exports !== 'undefined') {
        // Node/CommonJS, no need for jQuery in that case.
        factory(root, exports, require('underscore'), require('jquery'), require('Backbone'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD
        define(['underscore', 'jquery', 'Backbone', 'exports'],
            function (_, $, Backbone, exports) {
                // Export global even in AMD case in case this script is loaded with
                // others that may still expect a global Backbone.
                root.BackStack = factory(root, exports, _, $, Backbone);
            });
    } else {
        // Browser globals
        root.BackStack = factory(root, {}, root._, root.jQuery, root.Backbone);
    }
}(this, function (root, BackStack, _, $, Backbone) {

    /**
     * Helper function to detect browser vendor prefix.
     * Thanks to Lea Verou: http://lea.verou.me/2009/02/find-the-vendor-prefix-of-the-current-browser/
     * I just modified it slightly as I expect it to be used in mobile/WebKit scenarios mostly.
     */
    var getVendorPrefix = BackStack.getVendorPrefix = function () {
        if ('result' in arguments.callee) return arguments.callee.result;

        var regex = /^(Moz|Webkit|Khtml|O|ms|Icab)(?=[A-Z])/;

        var someScript = document.getElementsByTagName('script')[0];

        // Exception for WebKit based browsers
        if ('WebkitOpacity' in someScript.style) return arguments.callee.result = 'Webkit';
        if ('KhtmlOpacity' in someScript.style) return arguments.callee.result = 'Khtml';

        for (var prop in someScript.style) {
            if (regex.test(prop)) {
                // test is faster than match, so it's better to perform
                // that on the lot and match only when necessary
                return arguments.callee.result = prop.match(regex)[0];
            }
        }
        return arguments.callee.result = '';
    };

    /**
     * No transition effect implementation.
     */
    var StackNavigatorNoEffect = BackStack.StackNavigatorNoEffect = function (stackNavigator) {
        this.stackNavigator = stackNavigator;
    };

    StackNavigatorNoEffect.prototype.play = function (fromView, toView, callback, context) {
        if (toView) {
            // Showing the view
            toView.css('display', toView.data('original-display'));
            toView.removeData('original-display');
        }
        callback.call(context);
    };

    /**
     * Fade transition effect implementation.
     */
    var StackNavigatorFadeEffect = BackStack.StackNavigatorFadeEffect = function (stackNavigator, effectParams) {
        this.stackNavigator = stackNavigator;
        this.effectParams = 'opacity ' + (effectParams) ? effectParams : '0.2s linear 0.1s';
        this.vendorPrefix = getVendorPrefix();
    };
    StackNavigatorFadeEffect.prototype.play = function (fromView, toView, callback, context) {
        var activeTransitions = 0,
            transitionEndEvent;

        if (this.vendorPrefix == 'Moz' || this.vendorPrefix == '')
            transitionEndEvent = 'transitionend';
        else if (this.vendorPrefix == 'ms')
            transitionEndEvent = 'MSTransitionEnd';
        else
            transitionEndEvent = this.vendorPrefix.toLowerCase() + 'TransitionEnd';

        var transitionEndHandler = function (event) {
            activeTransitions--;
            $(event.target)[0].style[this.vendorPrefix + 'Transition'] = '';

            if (activeTransitions == 0 && callback) {
                callback.call(context);
            }
        };

        if (fromView) {
            fromView.one(transitionEndEvent, transitionEndHandler);
            fromView[0].style[this.vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;
        }

        if (toView) {
            // Setting initial opacity
            toView.css('opacity', 0);
            toView.one(transitionEndEvent, transitionEndHandler);
            toView[0].style[this.vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;

            // Showing the view
            toView.css('display', toView.data('original-display'));
            toView.removeData('original-display');
        }

        // This is a hack to force DOM reflow before transition starts
        this.stackNavigator.$el.css('width');

        if (toView)
            toView.css('opacity', 1);

        if (fromView)
            fromView.css('opacity', 0);

        var that = this;
        setTimeout(function () {
            if (activeTransitions > 0) {
                activeTransitions = 0;

                if (toView)
                    toView[0].style[that.vendorPrefix + 'Transition'] = '';
                if (fromView)
                    fromView[0].style[that.vendorPrefix + 'Transition'] = '';

                callback.call(context);
            }
        }, 350);
    };

    /**
     * Slide transition effect implementation.
     */
    var StackNavigatorSlideEffect = BackStack.StackNavigatorSlideEffect = function (stackNavigator, direction, effectParams) {
        this.stackNavigator = stackNavigator;
        this.direction = direction ? direction : 'left';
        this.effectParams = 'all ' + (effectParams ? effectParams : '0.4s ease-out 0.1s');
        this.vendorPrefix = getVendorPrefix();
    };
    StackNavigatorSlideEffect.prototype.play = function (fromView, toView, callback, context) {
        var activeTransitions = 0,
            transitionEndEvent,
            transformParams;

        if (this.vendorPrefix == 'Moz' || this.vendorPrefix == '')
            transitionEndEvent = 'transitionend';
        else if (this.vendorPrefix == 'ms')
            transitionEndEvent = 'MSTransitionEnd';
        else
            transitionEndEvent = this.vendorPrefix.toLowerCase() + 'TransitionEnd';

        var transitionEndHandler = function (event) {
            activeTransitions--;
            $(event.target)[0].style[this.vendorPrefix + 'Transition'] = '';

            if (activeTransitions == 0 && callback) {
                callback.call(context);
            }
        };

        if (fromView) {
            fromView.one(transitionEndEvent, transitionEndHandler);
            fromView.css('left', 0);
            fromView[0].style[this.vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;
        }

        if (toView) {
            toView.one(transitionEndEvent, transitionEndHandler);
            toView.css('left', this.direction == 'left' ? this.stackNavigator.$el.width() : -this.stackNavigator.$el.width());
            toView[0].style[this.vendorPrefix + 'Transition'] = this.effectParams;

            activeTransitions++;

            // Showing the view
            toView.css('display', toView.data('original-display'));
            toView.removeData('original-display');
        }

        if (fromView || toView) {
            // This is a hack to force DOM reflow before transition starts
            this.stackNavigator.$el.css('width');

            transformParams = 'translateX(' + (this.direction == 'left' ? -this.stackNavigator.$el.width() : this.stackNavigator.$el.width()) + 'px)';
        }

        if (fromView && toView)
            fromView[0].style[this.vendorPrefix + 'Transform'] = toView[0].style[this.vendorPrefix + 'Transform'] = transformParams;
        else if (toView)
            toView[0].style[this.vendorPrefix + 'Transform'] = transformParams;
        else if (fromView)
            fromView[0].style[this.vendorPrefix + 'Transform'] = transformParams;
    };

    /**
     * Extended Backbone.View with additional properties like viewPath, destructionPolicy and a reference to parent
     * StackNavigator.
     */
    var View = BackStack.StackView = Backbone.View.extend({

        /**
         * Posible options auto or never
         */
        destructionPolicy:"auto",

        /**
         * Reference to parent StackNavigator
         */
        stackNavigator:undefined,

        /**
         *
         */
        rendered:false,

        setStackNavigator:function (stackNavigator, navigationOptions) {
            this.stackNavigator = stackNavigator;

            if (navigationOptions) {
                if (navigationOptions.destructionPolicy)
                    this.destructionPolicy = navigationOptions.destructionPolicy;
            }

            // Setting default styles
            this.$el.css({position:'absolute', overflow:'hidden', width:'100%', height:'100%'});
        }
    });

    /**
     * Private common push method.
     *
     * @param fromViewRef - reference to from view
     * @param toViewRef - reference to to view
     * @param transition - transition to played during push
     */
    var push = function (fromViewRef, toViewRef, transition) {

        // Hiding view
        toViewRef.instance.$el.data('original-display', toViewRef.instance.$el.css('display'));
        toViewRef.instance.$el.css('display', 'none');
        // Adding view to the DOM
        this.$el.append(toViewRef.instance.$el);
        // Rendering view if required
        if (!toViewRef.instance.rendered) {
            toViewRef.instance.render.call(toViewRef.instance);
            toViewRef.instance.rendered = true;
        }
        // Adding view to the stack internal array
        this.viewsStack.push(toViewRef);

        transition = transition || this.defaultPushTransition || (this.defaultPushTransition = new StackNavigatorSlideEffect(this, 'left'));
        transition.play(fromViewRef ? fromViewRef.instance.$el : null, toViewRef.instance.$el,
            function () {

                this.activeView = toViewRef.instance;
                toViewRef.instance.$el.trigger('viewActivate');

                if (fromViewRef) {
                    fromViewRef.instance.$el.trigger('viewDeactivate');

                    if (fromViewRef.instance.destructionPolicy == 'never') {
                        fromViewRef.instance.$el.detach();
                    } else {
                        fromViewRef.instance.remove();
                        fromViewRef.instance = null;
                    }
                }

                this.trigger('viewChanged');
            }, this);
    };

    var pop = function (fromViewRef, toViewRef, transition) {

        // Removing top view ref from the stack array
        this.viewsStack.pop();

        if (toViewRef) {

            if (!toViewRef.instance) {
                // Getting view class declaration
                var viewClass = toViewRef.viewClass;
                // Creating view instance
                toViewRef.instance = new viewClass(toViewRef.options);
                // Setting ref to StackNavigator
                toViewRef.instance.setStackNavigator(this, toViewRef.options ? toViewRef.options.navigationOptions : null);
            }

            // Hiding view
            toViewRef.instance.$el.data('original-display', toViewRef.instance.$el.css('display'));
            toViewRef.instance.$el.css('display', 'none');

            // Adding view to the DOM
            this.$el.append(toViewRef.instance.$el);
            // Rendering view if required
            if (!toViewRef.instance.rendered) {
                toViewRef.instance.render.call(toViewRef.instance);
                toViewRef.instance.rendered = true;
            }

        }

        transition = transition || this.defaultPopTransition || (this.defaultPopTransition = new StackNavigatorSlideEffect(this, 'right'));
        transition.play(fromViewRef.instance.$el, toViewRef ? toViewRef.instance.$el : null,
            function () {

                if (toViewRef) {
                    this.activeView = toViewRef.instance;
                    toViewRef.instance.$el.trigger('viewActivate');
                } else {
                    this.activeView = null;
                }

                fromViewRef.instance.$el.trigger('viewDeactivate');
                fromViewRef.instance.remove();
                fromViewRef.instance = null;

                this.trigger('viewChanged');
            }, this);
    }

    BackStack.StackNavigator = Backbone.View.extend({

        viewsStack:null,

        activeView:null,

        defaultPushTransition:null,

        defaultPopTransition:null,

        events:{
            'viewActivate':'proxyActivationEvents',
            'viewDeactivate':'proxyActivationEvents'
        },

        proxyActivationEvents:function (event) {
            this.trigger(event.type, event);
        },

        initialize:function (options) {
            // Setting default styles
            this.$el.css({overflow:'hidden'});

            // Setting new viewsStack array
            this.viewsStack = [];
        },

        pushView:function (view, viewOptions, transition) {
            var toView, toViewRef,
                isViewInstance = (typeof view !== 'function'),
                fromViewRef = _.last(this.viewsStack);

            toView = (!isViewInstance) ? new view(viewOptions) : view;
            toView.setStackNavigator(this, (viewOptions) ? viewOptions.navigationOptions : null);
            toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions};

            var event = $.Event('viewChanging',
                {
                    action:'push',
                    fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                    fromView:fromViewRef ? fromViewRef.instance : null,
                    toViewClass:toViewRef.viewClass,
                    toView:toViewRef.instance
                });
            this.trigger(event.type, event);

            if (!event.isDefaultPrevented()) {

                push.call(this, fromViewRef, toViewRef, transition);

                return toView;
            }

            return null;
        },

        popView:function (transition) {
            var toViewRef, fromViewRef;
            if (this.viewsStack.length > 0)
                fromViewRef = this.viewsStack[this.viewsStack.length - 1];

            if (this.viewsStack.length > 1)
                toViewRef = this.viewsStack[this.viewsStack.length - 2];

            var event = $.Event('viewChanging',
                {
                    action:'pop',
                    fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                    fromView:fromViewRef ? fromViewRef.instance : null,
                    toViewClass:toViewRef ? toViewRef.viewClass : null,
                    toView:toViewRef ? toViewRef.instance : null
                });
            this.trigger(event.type, event);

            if (!event.isDefaultPrevented()) {

                var fromView = fromViewRef.instance;
                pop.call(this, fromViewRef, toViewRef, transition);

                return fromView;
            }

            return null;
        },

        popAll:function (transition) {
            if (this.viewsStack.length > 0) {

                var fromViewRef;
                if (this.viewsStack.length > 0)
                    fromViewRef = this.viewsStack[this.viewsStack.length - 1];

                var event = $.Event('viewChanging',
                    {
                        action:'popAll',
                        fromViewClass:fromViewRef ? fromViewRef.viewClass : null,
                        fromView:fromViewRef ? fromViewRef.instance : null,
                        toViewClass:null,
                        toView:null
                    });
                this.trigger(event.type, event);

                if (!event.isDefaultPrevented()) {
                    // Removing views except the top one
                    this.viewsStack.splice(0, this.viewsStack.length - 1);
                    pop.call(this, fromViewRef, null, transition);
                }
            }
            return null;
        },

        replaceView:function (view, viewOptions, transition) {
            if (this.viewsStack.length > 0) {

                var toView, toViewRef,
                    isViewInstance = (typeof view !== 'function'),
                    fromViewRef = this.viewsStack[this.viewsStack.length - 1];

                toView = (!isViewInstance) ? new view(viewOptions) : view;
                toView.setStackNavigator(this, (viewOptions) ? viewOptions.navigationOptions : null);
                toViewRef = {instance:toView, viewClass:toView.constructor, options:viewOptions};

                var event = $.Event('viewChanging',
                    {
                        action:'replace',
                        fromViewClass:fromViewRef.viewClass,
                        fromView:fromViewRef.instance,
                        toViewClass:toViewRef.viewClass,
                        toView:toViewRef.instance
                    });
                this.trigger(event.type, event);

                if (!event.isDefaultPrevented()) {

                    this.viewsStack.pop();
                    push.call(this, fromViewRef, toViewRef, transition);

                    return toView;
                }
            }
            return null;
        }
    });

    return BackStack;
}));