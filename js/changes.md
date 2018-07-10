# Changelog
All changes to js/  will be documented in this file.

## apiHandler

#### Change
- map and calendar object store are autoIncremented with common index on activityId and index on location for map and index on date for calendar/

- ```putMap``` 
    - first deletes the record where location from removeVenue array matches the location inside the records of the map object store.
    - After all the deletion is performed, the new records are added into the object store

- ```putDates``` 
    - find the min and max date from removeSchedule and activity.schedule. 
    - from calendarObject store all the records having the same activityId are removed.
    - after all records for a particular activityId are deleted, iteration starts on date b/w min and max
    - for each date , check if it falls b/w the ```startTime``` and ```endTime``` of newSchedule.
    - If it falls then a record is created inside calendar obejct store

- ```fromObjectStore```
    - due to changes in es6 for support of **ISO-8601** , ```Date.parse``` is now used to convert the **upto** from read API response  to UTC format.

- A common function for handling error and success messages called ```requestHandlerResponse```.
    - For every error or success message inside apiHandler , a message is passed from worker to the ```requestCreator```

## mapView

#### Added
- mapView is now fully completed
