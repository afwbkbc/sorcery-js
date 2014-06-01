Sorcery.define([
  'class/service',
  'service/algorithms',
],function(Service,Algorithms){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Service.extend({

    set_unique_attribute : Sorcery.method(function(element,attribute,prefix){
      var sid=Sorcery.begin();
      
      this.get_unique_attribute(attribute,prefix,function(value){
        element.setAttribute(attribute,value);
        Sorcery.end(sid,value);
      });
      
    }),
    
    get_unique_attribute : Sorcery.method(function(attribute,prefix){
      var sid=Sorcery.begin();
      
      if (prefix)
        prefix+='_';
      else prefix='';
      
      var tryfunc=function(){
        Algorithms.get_random_ascii_string(16,function(value){
          value=prefix+value;
          var chk=document.querySelector('['+attribute+'="'+value+'"]');
          if (chk===null)
            Sorcery.end(sid,value);
          else return tryfunc();
        });
      };
      tryfunc();
      
    }),
    
  });
  
});