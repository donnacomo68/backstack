/**
 * Created by Piotr Walczyszyn (outof.me | @pwalczyszyn)
 *
 * User: pwalczys
 * Date: 4/14/12
 * Time: 12:48 PM
 */

define(function () {

    var StackView = Backbone.View.extend({

        /**
         * Posible options auto or never
         */
        destructionPolicy:"auto",

        /**
         * Reference to parent StackNavigator
         */
        stackNavigator:null,

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

    return StackView;
});