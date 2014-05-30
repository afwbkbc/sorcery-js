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
      
      var currenturl=window.location.pathname;
      var match=this.match_path(currenturl);
      
      if (match===null) {
        // 404
      }
      else {
        match.route.handler.apply(null,match.args);
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
    
    // TODO: optimize
    match_path : function(url) {
      if (url[0]==='/')
        url=url.substring(1);
      for (var i in this.routes) {
        var route=this.routes[i];
        var pattern=route.pattern;
        var args=[];
        
        var rarr=pattern.split('/');
        var uarr=url.split('/');
        
        if (uarr.length>rarr.length)
          continue;
        
        var match=true;
        
        while (rarr.length) {
          var rv=rarr[0];
          rarr=rarr.splice(1);
          if (!uarr.length) {
            if ((rv[0]===':')&&((typeof(route.defaults)!=='undefined')&&(typeof(route.defaults[rv.substring(1)])!=='undefined'))) {
              uarr.push(route.defaults[rv.substring(1)]);
            }
            else {
              match=false;
              break;
            }
          }
          var uv=uarr[0];
          uarr=uarr.splice(1);
          if (rv[0]===':')
            args.push(uv);
          else if (rv!=uv) {
            match=false;
            break;
          }
        }
        
        if (match) {
          return {
            route:route,
            args:args,
          };
          //console.log('MATCH',pattern,url,args);
        }
        
      }
      return null;
    },
    
    handle_route : function(route, parameters) {
      
    },
    
  });
  
});