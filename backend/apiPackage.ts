//has all packages functions needed for backend API
import * as apiSchema from './apiSchema';
const packageObject: apiSchema.Package = {
    metadata: {
      Name: 'Package Name',
      Version: '1.0.0',
      ID: '12345',
    },
    data: {
      Content: 'Base64EncodedContent',
    },
  };

console.log(packageObject)