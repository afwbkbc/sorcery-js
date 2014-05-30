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
          
          document.body.innerHTML='<a href="'+Router.generate('hi',{
            name:'michael',
          })+'">HI</a>';
          
          document.body.innerHTML+='<br /><a href="http://www.google.ru/">google</a>';
          
        }
      });
      
    }
    
  });
  
});