Sorcery.define([
  'class/service',
],function(Service){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Service.extend({
    
    get_file : function(path,success,error) {
      
      var xmlhttp=new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 ) {
           if (xmlhttp.status == 200) {
             if (typeof(success)==='function')
               return success(xmlhttp.responseText);
           }
           else { 
             if (typeof(error)==='function')
               return error();
           }
        }
      };
      xmlhttp.open('GET', path, true);
      xmlhttp.send();
    },
    
    js_loaded : {},
    
    get_js : function(path,success,error) {
      
      if (typeof(this.js_loaded[path])!=='undefined')
        return;
      
      this.js_loaded[path]=true;
      
      var script = document.createElement('script');
      script.src=path;
      script.onload=function(e){
        if (typeof(success)==='function')
          return success();
      };
      script.onerror=function(e){
        if (typeof(error)==='function')
          return error();
      };
      document.body.appendChild(script);
      return script;
      
    },
    
  });
});