/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { PureComponent } from "react";
import PropTypes from "prop-types";

const propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.obj,
  onChange: PropTypes.func,
  required: PropTypes.bool,
  helpText: PropTypes.string
};

export default class FormInput extends PureComponent {
  constructor(props) {
    super(props);
  }

  render() {
    const {
      name,
      type,
      placeholder,
      value,
      onChange,
      required,
      helpText
    } = this.props;
    const help = helpText && <span className="help-block">{helpText}</span>;
    return (
      <>
        <input
          className="form-control"
          type={type}
          id={name}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
        />
        {help}
      </>
    );
  }
}

FormInput.propTypes = propTypes;
