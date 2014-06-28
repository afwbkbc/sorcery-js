Sorcery.define([
  'class/controller',
  'view/layout',
],function(
  Controller,
  LayoutView
){

  return Controller.extend({
    
    register : function(Router) {

      var c=this;

      Router.route({
        name : 'root',
        pattern : '',
        handler : function() {
          
          /*Sorcery.construct(LayoutView,document.body,function(v){
            
            v.render(function(){
              console.log('RENDERED');
            });
            
          });*/
          
          c.set_views({
            template:'layout',
            arguments:{
              value:'val1',
            },
            children:[
              {
                selector:'.test1',
                template:'test/test1',
              },
              {
                selector:'.test2',
                template:'test/test2',
              }
            ],
          });

        }
      });
      
      Router.route({
        name : 'testroute',
        pattern : 'test/route',
        handler : function() {
          
          c.set_views({
            template:'layout',
            arguments:{
              value:'val2',
            },
            children:[
              {
                selector:'.test2',
                template:'test/test2',
              }
            ],
          });
        }
      });
      
    }
    
  });
  
});