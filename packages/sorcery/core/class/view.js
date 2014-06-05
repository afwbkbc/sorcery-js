Sorcery.define([
  'class/class',
  'service/fetcher',
  'service/dom',
  'service/globals',
//  'library/jquery',
],function(
    Class,
    Fetcher,
    Dom,
    Globals
//    jQuery
){
  
  Sorcery.require_environment(Sorcery.ENVIRONMENT_WEB);
  
  return Class.extend({

    construct : Sorcery.method(function(viewel) {
      var sid=Sorcery.begin();

      var self=this;
      
      self.data={}; 
      
      var final_func = function() {

        if (viewel.getAttribute('data-view')!==null)
          throw new Error('duplicate view on single element');
        
        Dom.set_unique_attribute(viewel,'data-view','view',function(id){
          
          self.id=id;
          
          Globals.store(id,self,function(){
            
            self.el=viewel;
            //self.$el=jQuery(self.el);
            
            Sorcery.end(sid);
            
          });
          
        });
        
      };
      
      var init_html = function() {
      
        if (typeof(self.template)==='undefined')
          self.template=self.module_name.replace('view/','template/');
        
        self.template_engine=null;
        
        var templatepath=null;
        
        for (var i in Sorcery.template_engines) {
          templatepath=Sorcery.resolve_path(self.template,i);
          if (templatepath!==null) {
            self.template_engine=i;
            break;
          }
        }
        if (templatepath===null)
          throw new Error('unable to find template "'+self.template+'"');
        else {
          templatepath+=Sorcery.template_engines[self.template_engine];
        }
        console.log('T',templatepath);
        Fetcher.get_file(templatepath,function(content){
          self.template_data=content;
          final_func();
        });
      };
      
      init_html();
      
      /*Fetcher.get_file('templates/'+this.template+'.html.twig',function(content){
        console.log('CONTENT',content);
        return Sorcery.end(sid);
      });*/
      
    }),
    
    render : Sorcery.method(function() {
      var sid=Sorcery.begin();
      
      var self=this;
      
      self.el.innerHTML='';
      // TODO: "loading" stuff?
      
      Sorcery.require([
        'service/template_engine/'+self.template_engine,
      ],function(Engine){
        
        Engine.render(self.template_data,self.data,function(processed_data){
          
          self.el.innerHTML=processed_data;
          
          return Sorcery.end(sid);
        });
        
      });
      
    }),
    
    destroy : Sorcery.method(function() {
      var sid=Sorcery.begin();
      
      console.log('PARENT DESTROY');
      
      return Sorcery.end(sid);
    })
    
  });
});