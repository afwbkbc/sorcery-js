Sorcery.define([
  'class/service',
],function(Service){
  return Service.extend({
    
    routes : [],
    
    initialize : function(controllers) {
      if (controllers) {
        for (var i in controllers) {
          var c=controllers[i];
          if (c.class_name==='controller') {
            c.register(this);
          }
        }
      }
      
      
    },
    
    route : function(route) {
      this.routes.push(route);
    },
    
    generate : function(name,parameters) {
      for (var i in this.routes) {
        var route=this.routes[i];
        if (route.name==name) {
          var url='/'+route.pattern+'/';
          if (!parameters)
            parameters={};
          if (route.defaults)
            for (var ii in route.defaults)
              if (typeof(parameters[ii])==='undefined')
                parameters[ii]=route.defaults[ii];
          for (var ii in parameters)
            url=url.replace('/:'+ii+'/','/'+parameters[ii]+'/');
          var chk=url.indexOf(':');
          if (chk>=0) {
            var p=url.substring(chk);
            chk=p.indexOf('/');
            if (chk>=0)
              p=p.substring(0,chk);
            throw new Error('Missing argument '+p+' for route "'+name+'" and no default value was provided!');
          }
          return url.substring(0,url.length-1);
        }
      }
      throw new Error('Route "'+name+'" does not exist!');
    },
    
  });
  
});