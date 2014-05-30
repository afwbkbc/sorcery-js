Sorcery.define([
  'class/library',
],function(Library){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Library.extend({
    
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
    
  });
});