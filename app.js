Sorcery.initialize(function(){
  
  Sorcery.require([
    'service/router',
    'app/controller/*',
  ],function(Router){

    Router.initialize(arguments);
    
    /*var urls=[
      Router.generate('root'),
      Router.generate('hello'),
      Router.generate('hello',{
        name:'john',
      }),
      Router.generate('hi'),
    ];*/
    
    //console.log('URL',urls);
    
    //Router.initialize();
    
  });
  
});