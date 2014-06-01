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
          
          Sorcery.construct(LayoutView,function(v1){
            
            Sorcery.construct(LayoutView,function(v2){
          
              console.log('V',v1,v2);
              
              Sorcery.destroy(v1,function(){
                
                Sorcery.destroy(v2,function(){
                  console.log('D',v1,v2);
                },2,2);
                
              },1,1);
          
            },'my2');
            
          },'my1');

          /*console.log('ROOT!');
          
          document.body.innerHTML='<a href="'+Router.generate('hi',{
            name:'michael',
          })+'">HI</a>';
          
          document.body.innerHTML+='<br /><a href="http://www.google.ru/">google</a>';*/
          
        }
      });
      
    }
    
  });
  
});