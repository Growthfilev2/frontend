# Changelog
All changes to js/  will be documented in this file.

## apiHandler
#### Removed
    - Unecessary ```requestHandlerResponse``` use 
    
#### Change
- map and calendar object store now delete records by opening a cursor on their respective activtyiId Index .After all records are deleted, new records are added by reading venue and schedule object from activity in response