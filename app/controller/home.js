Sorcery.define([
  'class/controller',
],function(Controller){

  return Controller.extend({
    
    register : function(Router) {

      Router.route({
        name : 'root',
        pattern : '',
        handler : function() {
          console.log('ROOT!');
        }
      });
      
    }
    
  });
  
});