import { DefaultAzureCredential } from '@azure/identity';
import { BlobServiceClient } from '@azure/storage-blob';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

// Opt-in cloud test target only. Never derive this from the production storage config.
const accountUrl=process.env.PROVIDER_MEDIA_TEST_AZURE_STORAGE_ACCOUNT_URL;
if(!accountUrl || !/^https:\/\/[a-z0-9]+\.blob\.core\.windows\.net\/?$/.test(accountUrl)){
  throw new Error('An explicit test Azure Storage account URL is required.');
}
const name=`fleshlab-media-it-${Date.now()}-${randomUUID().slice(0,8)}`;
const service=new BlobServiceClient(accountUrl,new DefaultAzureCredential());
const container=service.getContainerClient(name);
let created=false;
let succeeded=false;
try{
  await container.create();created=true;
  const properties=await container.getProperties();
  if(properties.blobPublicAccess)throw new Error('The test container must be private.');
  console.log(JSON.stringify({event:'azure_test_container_created',container:name,private:true,authentication:'DefaultAzureCredential'}));
  const result=await new Promise((resolve,reject)=>{
    const child=spawn('bash',['scripts/run-provider-media-integration.sh'],{
      cwd:new URL('..',import.meta.url),stdio:'inherit',
      env:{...process.env,PROVIDER_MEDIA_AZURE_INTEGRATION_ENABLED:'true',
        PROVIDER_MEDIA_TEST_PRIVATE_CONTAINER:name}});
    child.on('error',reject);child.on('exit',code=>resolve(code));
  });
  if(result!==0)throw new Error('The cloud integration tests failed.');
  let remaining=0;
  for await(const item of container.listBlobsFlat()){if(item.name)remaining++;}
  if(remaining!==0)throw new Error('Test artifact cleanup did not remove all blobs.');
  succeeded=true;
}catch(error){
  console.error(JSON.stringify({event:'azure_media_integration_failed',httpStatus:error.statusCode??null,
    errorCode:/^[A-Za-z0-9_]+$/.test(error.code||'')?error.code:'AZURE_TEST_FAILED'}));
  process.exitCode=1;
}finally{
  if(created){
    try{
      await container.delete();
      if(await container.exists())throw new Error('Test container still exists.');
      console.log(JSON.stringify({event:'azure_test_cleanup_verified',container:name,containerAbsent:true,testSucceeded:succeeded}));
    }catch{
      console.error(JSON.stringify({event:'azure_test_cleanup_failed',container:name}));process.exitCode=1;
    }
  }
}
