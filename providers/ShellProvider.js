/*
Copyright (c) 2012 Lalith Balasubramanian (ICRL)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var shell = require('shelljs');
var fs = require('fs'); 
// import the settings file to configure environment
var SETTINGS = fs.readFileSync('./config/settings.json');
	SETTINGS = JSON.parse(SETTINGS);

var xml2json = require('xml-mapping');

ShellProvider = function() {

};

ShellProvider.prototype.get_files = function (callback){
	  var outArray = shell.exec('ls '+SETTINGS.output_folder);
	  outArray.output = outArray.output.split("\n");
	  
	  for(i=0;i<outArray.output.length;i++)
	  if(outArray.output[i]!=null && outArray.output[i]!=""){
			outArray.output[i] = 'http://'+SETTINGS.host+':'+SETTINGS.port+'/output/'+outArray.output[i];
	  } else{
			outArray.output.pop();
	  }
	  
	  if(outArray.code == 0){
		  callback(JSON.stringify({"status":"success","description":outArray}))
	  } else{
		  callback(JSON.stringify({"status": "error","description":outArray}))
	  }
}

ShellProvider.prototype.execute_conversion = function(files,callback){
      var path     = files['file']['path'],
          filename = files['file']['filename'],
          mime     = files['file']['mime'];
     
	  
      var regex_filePath = path.split("/");
	  regex_file = regex_filePath[regex_filePath.length-1]; 

      var execute_path = SETTINGS.install_path+path;  
	  shell.mv('-f',execute_path,SETTINGS.output_folder+'/'+filename);	  
	  
	  var out = 'apktool d '+SETTINGS.output_folder+filename+' '+SETTINGS.output_folder+filename.replace(".apk","");
	  
	  var status = shell.exec(out);

	  shell.mv('-f',SETTINGS.output_folder+filename.replace(".apk","")+'/AndroidManifest.xml',SETTINGS.output_folder+'/AndroidManifest.xml');

	  shell.exec('rm -rf '+SETTINGS.output_folder+filename.replace(".apk",""));
  	  shell.exec('rm -rf '+SETTINGS.output_folder+filename.replace(".apk",".zip"));	  

	  var outputJson;
	  fs.readFile(SETTINGS.output_folder+'/AndroidManifest.xml','utf8', function (err, data) {
		  if (err) throw err;
	 	  console.log('XML\n');
	 	  console.log(data);
		  outputJson = xml2json.load(data);	  
	 	  console.log('JSON \n');
		  console.log(outputJson.manifest);
	  });

  	  
	  if(status.code == 0){
		  console.log("\n\nSuccessful Conversion\n");
		  callback(JSON.stringify({"status":"success","manifest":outputJson,"errors":null}))		  
	  }else{
		  callback(JSON.stringify({"status":"failed","manifest":outputJson,"errors":status.output}))
	  }
	      
}

exports.ShellProvider = ShellProvider;