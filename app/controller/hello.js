Sorcery.define([
  'class/controller',
],function(Controller){
  
  return Controller.extend({
  
    register : function(Router) {
  
      Router.route({
        name : 'hello',
        pattern : 'hello/:name',
        defaults : {
          name : 'guest',
        },
        handler : function(name) {
          console.log('HELLO '+name+'!');
        }
      });
      
      Router.route({
        name : 'hi',
        pattern : 'hi/:name',
        handler : function(name) {
          console.log('HI '+name+'!');
        }
      });
      
    }
  
  });
  
});