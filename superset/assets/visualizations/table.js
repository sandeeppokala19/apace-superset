import d3 from 'd3';
import 'datatables-bootstrap3-plugin/media/css/datatables-bootstrap3.css';
import 'datatables.net';
import dt from 'datatables.net-bs';
import 'datatables.net-buttons';
import 'datatables.net-buttons-bs';


import { fixDataTableBodyHeight } from '../javascripts/modules/utils';
import { timeFormatFactory, formatDate } from '../javascripts/modules/dates';
import './table.css';

const $ = require('jquery');

dt(window, $);
const buttons = require( 'datatables.net-buttons/js/buttons.html5.js' ) (window, $);

function tableVis(slice, payload) {
  const container = $(slice.selector);
  const fC = d3.format('0,000');
  let timestampFormatter;

  const data = payload.data;
  const fd = slice.formData;

  // Removing metrics (aggregates) that are strings
  let metrics = fd.metrics || [];
  metrics = metrics.filter(m => !isNaN(data.records[0][m]));

  function col(c) {
    const arr = [];
    for (let i = 0; i < data.records.length; i += 1) {
      arr.push(data.records[i][c]);
    }
    return arr;
  }
  const maxes = {};
  for (let i = 0; i < metrics.length; i += 1) {
    maxes[metrics[i]] = d3.max(col(metrics[i]));
  }

  if (fd.table_timestamp_format === 'smart_date') {
    timestampFormatter = formatDate;
  } else if (fd.table_timestamp_format !== undefined) {
    timestampFormatter = timeFormatFactory(fd.table_timestamp_format);
  }

  const div = d3.select(slice.selector);
  div.html('');
  const table = div.append('table')
    .classed(
      'dataframe dataframe table table-striped table-bordered ' +
      'table-condensed table-hover dataTable no-footer', true)
    .attr('width', '100%');

  const height = slice.height();
  let paging = false;
  let pageLength;
  if (fd.page_length && fd.page_length > 0) {
    paging = true;
    pageLength = parseInt(fd.page_length, 10);
  }
  let buttons_ = [];
  if (fd.csv_button) {
    buttons_.push('csvHtml5');
    console.log(buttons_);
  }
  
  table.append('thead').append('tr')
    .selectAll('th')
    .data(data.columns)
    .enter()
    .append('th')
    .text(function (d) {
      return d;
    });
  
  let datatable;

  if ((!data.columns.find((c) => {
        return metrics.indexOf(c) >= 0;
      }))) {
    let columns = [];
    data.columns.map((c) => {
      columns.push({data: c});
    });
    console.log(columns);
    datatable = container.find('.dataTable').DataTable({
      dom: "Bflrtip",
      data: data.records,
      columns: columns,
      paging: paging,
      deferRender: true,
      pageLength: pageLength,
      searching: fd.include_search,
      buttons: buttons_,
    });
  } else {
    table.append('tbody')
      .selectAll('tr')
      .data(data.records)
      .enter()
      .append('tr')
      .selectAll('td')
      .data(row => data.columns.map((c) => {
        const val = row[c];
        let html;
        const isMetric = metrics.indexOf(c) >= 0;
        if (c === 'timestamp') {
          html = timestampFormatter(val);
        }
        if (typeof (val) === 'string') {
          html = `<span class="like-pre">${val}</span>`;
        }
        if (isMetric) {
          html = slice.d3format(c, val);
        }
        return {
          col: c,
          val,
          html,
          isMetric,
        };
      }))
      .enter()
      .append('td')
      .style('background-image', function (d) {
        if (d.isMetric) {
          const perc = Math.round((d.val / maxes[d.col]) * 100);
          // The 0.01 to 0.001 is a workaround for what appears to be a
          // CSS rendering bug on flat, transparent colors
          return (
            `linear-gradient(to right, rgba(0,0,0,0.2), rgba(0,0,0,0.2) ${perc}%, ` +
            `rgba(0,0,0,0.01) ${perc}%, rgba(0,0,0,0.001) 100%)`
          );
        }
        return null;
      })
      .attr('title', (d) => {
        if (!isNaN(d.val)) {
          return fC(d.val);
        }
        return null;
      })
      .attr('data-sort', function (d) {
        return (d.isMetric) ? d.val : null;
      })
      .on('click', function (d) {
        if (!d.isMetric && fd.table_filter) {
          const td = d3.select(this);
          if (td.classed('filtered')) {
            slice.removeFilter(d.col, [d.val]);
            d3.select(this).classed('filtered', false);
          } else {
            d3.select(this).classed('filtered', true);
            slice.addFilter(d.col, [d.val]);
          }
        }
      })
      .style('cursor', function (d) {
        return (!d.isMetric) ? 'pointer' : '';
      })
      .html(d => d.html ? d.html : d.val);

    datatable = container.find('.dataTable').DataTable({
      dom: "Blfrtip",
      paging: paging,
      deferRender: true,
      pageLength: pageLength,
      aaSorting: [],
      searching: fd.include_search,
      bInfo: false,
      buttons: buttons_,
    });
  }
  fixDataTableBodyHeight(
      container.find('.dataTables_wrapper'), height);
  // Sorting table by main column
  if (metrics.length > 0) {
    const mainMetric = metrics[0];
    datatable.column(data.columns.indexOf(mainMetric)).order('desc').draw();
  }
  container.parents('.widget').find('.tooltip').remove();
}

module.exports = tableVis;
