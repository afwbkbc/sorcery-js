Sorcery.initialize(function(){
  
  Sorcery.require([
    'service/router',
    'app/controller/*',
  ],function(Router){

    Router.initialize(arguments);
    
  });
  
});