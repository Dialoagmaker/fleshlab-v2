@description('Dedicated FLESHLAB-only resource group deployment. No Columbus resources are referenced.')
param location string = resourceGroup().location
param vmName string = 'fleshlab-prod-vm'
param adminPublicKey string

resource vnet 'Microsoft.Network/virtualNetworks@2024-05-01' = {
  name: 'fleshlab-prod-vnet'
  location: location
  properties: { addressSpace: { addressPrefixes: ['10.70.0.0/16'] }, subnets: [{ name: 'app', properties: { addressPrefix: '10.70.1.0/24' } }] }
}
resource publicIp 'Microsoft.Network/publicIPAddresses@2024-05-01' = {
  name: 'fleshlab-prod-pip'
  location: location
  sku: { name: 'Standard' }
  properties: { publicIPAllocationMethod: 'Static' }
}
resource nsg 'Microsoft.Network/networkSecurityGroups@2024-05-01' existing = { name: 'fleshlab-prod-nsg' }
resource nic 'Microsoft.Network/networkInterfaces@2024-05-01' = {
  name: '${vmName}-nic'
  location: location
  properties: {
    networkSecurityGroup: { id: nsg.id }
    ipConfigurations: [{ name: 'app', properties: { privateIPAllocationMethod: 'Dynamic', subnet: { id: '${vnet.id}/subnets/app' }, publicIPAddress: { id: publicIp.id } }]
  }
}
resource vm 'Microsoft.Compute/virtualMachines@2024-03-01' = {
  name: vmName
  location: location
  identity: { type: 'SystemAssigned' }
  properties: {
    hardwareProfile: { vmSize: 'Standard_B2s' }
    storageProfile: { imageReference: { publisher: 'Canonical', offer: 'ubuntu-24_04-lts', sku: 'server', version: 'latest' }, osDisk: { createOption: 'FromImage', managedDisk: { storageAccountType: 'StandardSSD_LRS' } } }
    osProfile: { computerName: vmName, adminUsername: 'fleshlabadmin', linuxConfiguration: { disablePasswordAuthentication: true, ssh: { publicKeys: [{ path: '/home/fleshlabadmin/.ssh/authorized_keys', keyData: adminPublicKey }] } } }
    networkProfile: { networkInterfaces: [{ id: nic.id }] }
  }
}
