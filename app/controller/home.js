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
          
          return {
            template:'layout',
            arguments:{
              asd:'qwe1'
            },
            children:[
              {
                selector:'.test1',
                template:'test/test1'
              },
              {
                selector:'.test2',
                template:'test/test2',
                arguments:{
                  qwe:'zxc'
                }
              }
            ]
          };

        }
      });
      
      Router.route({
        name : 'testroute',
        pattern : 'test/route',
        handler : function() {
          
          return {
            template:'layout',
            arguments:{
              asd:'qwe2'
            },
            children:[
              {
                selector:'.test1',
                template:'test/test1'
              },
              {
                selector:'.test2',
                template:'test/test2'
              }
            ]
          };
          
        }
      });
      
    }
    
  });
  
});