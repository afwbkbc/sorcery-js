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
  
  return Class.extend({

    construct : Sorcery.method(function(viewel) {
      var sid=Sorcery.begin();

      var self=this;
      
      self.data={}; 
      
      var todo=2;
      
      var final_func = function() {
        
        todo--;
        if (!todo) {
        
          if (viewel.getAttribute('data-view')!==null)
            throw new Error('duplicate view on single element');

          Dom.set_unique_attribute(viewel,'data-view','view',function(id){

            self.id=id;
            Globals.store(id,self,function(){

              self.el=viewel;
              //self.$el=jQuery(self.el);
              return Sorcery.end(sid);

            });

          });
          
        }
        
      };
      
      var init_template = function() {
      
        if (typeof(self.template)==='undefined')
          self.template=self.module_name.replace('view/','template/');
        
        self.template_engine=null;
        
        var templatepath=null;
        for (var i in Sorcery.template_engines) {
          templatepath=Sorcery.resolve_path(self.template,'template/'+i);
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

        Fetcher.get_file(templatepath,function(content){
          self.template_data=content;
          return final_func();
        });
        
      };
      
      var init_style = function() {
        
        if (typeof(self.style)==='undefined')
          self.style=self.module_name.replace('view/','style/');
        
        self.style_engine=null;
        
        var stylepath=null;
        for (var i in Sorcery.style_engines) {
          stylepath=Sorcery.resolve_path(self.style,'style/'+i);
          if (stylepath!==null) {
            self.style_engine=i;
            break;
          }
        }
        if (stylepath===null)
          throw new Error('unable to find style "'+self.style+'"');
        else {
          stylepath+=Sorcery.style_engines[self.style_engine];
        }
        
        Fetcher.get_file(stylepath,function(content){
          self.style_data=content;
          return final_func();
        });
        
      };
      
      init_template();
      init_style();
      
    }),
    
    set : Sorcery.method(function(values) {
      var sid=Sorcery.begin();
      
      for (var i in values) {
        this.data[i]=values[i];
      }
      
      return Sorcery.end(sid);
    }),
    
    render : Sorcery.method(function() {
      var sid=Sorcery.begin();
      
      var self=this;
      
      self.el.innerHTML='';
      // TODO: "loading" stuff?
      
      Sorcery.require([
        'service/style_engine/'+self.style_engine,
        'service/template_engine/'+self.template_engine,
      ],function(StyleEngine,TemplateEngine){
        
        var finalfunc=function() {
          
          TemplateEngine.render(self.template_data,self.data,function(processed_data){

            self.el.innerHTML=processed_data;

            return Sorcery.end(sid);
          });
        
        };
        
        var myid=self.el.getAttribute('data-view');
        var el=document.head.querySelector('style[data-view="'+myid+'"]');
        if (el!==null)
          return finalfunc();
        else {
          
          StyleEngine.render(self.style_data,function(processed_data){

            var el=document.createElement('STYLE');
            el.setAttribute('data-view',myid);
            el.innerHTML=processed_data;
            document.head.appendChild(el);

            return finalfunc();
            
          });
          
        }
        
      });
      
    }),
    
    remove_children : Sorcery.method(function(){
      var sid=Sorcery.begin();
      var self=this;
      if (self.el) {
        var els=self.el.querySelectorAll('[data-view]');
        var childels=[];
        for (var i in els) {
          var el=els[i];
          if (Dom.is_element(el)) {
            var chk=el.parentNode;
            while ((chk!==document)&&(chk!==null)) {
              var a=chk.getAttribute('data-view');
              if (a!==null) {
                if (a===self.id) // only accept direct children
                  childels.push(el);
                break;
              }
              chk=chk.parentNode;
            }
          }
        }
        
        //console.log('ELS',childels);
        
        var i;
        Sorcery.loop.for(
          function(){ i=0 },
          function(){ return i<childels.length },
          function(){ i++ },
          function(cont){
            var el=childels[i];
            Globals.retrieve(el.getAttribute('data-view'),function(v){
              //console.log('TRY',el,v,Globals);
              if (typeof(v.remove)==='function') {
                v.remove(function(){
                  return cont();
                });
              }
              else {
                el.removeAttribute('data-view');
                return cont();
              }
            });
          },
          function(){
            //console.log('ALL DONE');
            return Sorcery.end(sid);
          }
        );
        
        
      }
      else
        return Sorcery.end(sid);
    }),
    
    remove : Sorcery.method(function(){
      var sid=Sorcery.begin();
      
      var self=this;
      
      this.remove_children(function(){
        Sorcery.destroy(self,function(){
          return Sorcery.end(sid);
        });
      });
    }),
    
    destroy : Sorcery.method(function() {
      var sid=Sorcery.begin();

      var self=this;

      this.remove_children(function(){
        
        if (self.el) {
          var myid=self.el.getAttribute('data-view');
          var style=document.head.querySelector('style[data-view="'+myid+'"]');
          if (style!==null)
            style.remove();
          self.el.innerHTML='';
          self.el.removeAttribute('data-view');
          self.el=null;
        }
        
        return Sorcery.end(sid);
      });

    })
    
  });
});