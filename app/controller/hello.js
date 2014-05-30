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

      Router.route({
        name : 'helloplus',
        pattern : 'hello/:a/:b/:c/:name',
        defaults : {
          a : 'A',
          b : 'B',
          c : 'C',
          name : 'guest',
        },
        handler : function(a,b,c,name) {
          console.log('HELLO!!! ',a,b,c,name);
        }
      })
      
    }
  
  });
  
});