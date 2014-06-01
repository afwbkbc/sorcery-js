Sorcery.define([
  'class/controller',
  'view/layout',
],function(
  Controller,
  LayoutView
){

  return Controller.extend({
    
    register : function(Router) {

      Router.route({
        name : 'root',
        pattern : '',
        handler : function() {
          
          Sorcery.construct(LayoutView,document.body,function(v){
            
            v.render(function(){
              console.log('RENDERED');
            });
            
          });

          /*document.body.innerHTML='<a href="'+Router.generate('hi',{
            name:'michael',
          })+'">HI</a>';
          
          document.body.innerHTML+='<br /><a href="http://www.google.ru/">google</a>';*/
          
        }
      });
      
    }
    
  });
  
});