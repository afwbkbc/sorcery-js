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
          
          Sorcery.construct(LayoutView,'my1','xcvxvc',function(v1){
            
            Sorcery.construct(LayoutView,'my2',function(v2){
          
              console.log('V',v1,v2);
              
              Sorcery.destroy(v1,'a1','a2',function(){
                
                Sorcery.destroy(v2,'a1','a2',function(){
                  console.log('D',v1,v2);
                });
                
              });
          
            });
            
          });

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