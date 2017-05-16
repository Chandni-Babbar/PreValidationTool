Number.prototype.toCommaFrmt = function(){
    return this.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
String.prototype.toCommaFrmt = function(){
    return this.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

Number.prototype.removeCommaFrmt = function(){
    return this.toString().replace(/\,/g,'');
}
String.prototype.removeCommaFrmt = function(){
    return this.replace(/\,/g,'');
}

Date.prototype.startOfWeek = function(pStartOfWeek) {
    var mDifference = this.getDay() - pStartOfWeek;

    if (mDifference < 0) {
        mDifference += 7;
    }

    return new Date(this.addDays(mDifference * -1));
}

Date.prototype.addDays = function(pDays) {
    var mDate = new Date(this.valueOf());
    mDate.setDate(mDate.getDate() + pDays);
    return mDate;
}

Date.prototype.toYYYYMMDD = function() {
    var d = new Date(this.valueOf()),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}