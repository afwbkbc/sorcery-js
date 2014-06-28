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
          
          c.set_views({
            template:'layout',
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
          },function(){
            console.log('SETVIEWS1 DONE');
          });

        }
      });
      
      Router.route({
        name : 'testroute',
        pattern : 'test/route',
        handler : function() {
          
          c.set_views({
            template:'layout',
            children:[
              {
                selector:'.test2',
                template:'test/test2',
              }
            ],
          },function(){
            console.log('SETVIEWS2 DONE');
          });
        }
      });
      
    }
    
  });
  
});