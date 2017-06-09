import React from 'react';
import PropTypes from 'prop-types';
import TooltipWrapper from './TooltipWrapper';

class EditableTitle extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      isEditing: false,
      title: this.props.title,
      lastTitle: this.props.title,
    };
    this.handleClick = this.handleClick.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
    this.handleChange = this.handleChange.bind(this);
  }
  handleClick() {
    if (!this.props.canEdit) {
      return;
    }

    this.setState({
      isEditing: true,
    });
  }
  handleBlur() {
    if (!this.props.canEdit) {
      return;
    }

    this.setState({
      isEditing: false,
    });

    if (this.state.lastTitle !== this.state.title) {
      this.setState({
        lastTitle: this.state.title,
      });
      this.props.onSaveTitle(this.state.title);
    }
  }
  handleChange(ev) {
    if (!this.props.canEdit) {
      return;
    }

    this.setState({
      title: ev.target.value,
    });
  }
  render() {
    return (
      <span className="editable-title">
        <TooltipWrapper
          label="title"
          tooltip={this.props.canEdit ? 'click to edit title' : 'You don\'t have the rights to alter this title.'}
        >
          <input
            required
            type={this.state.isEditing ? 'text' : 'button'}
            value={this.state.title}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            onClick={this.handleClick}
          />
        </TooltipWrapper>
      </span>
    );
  }
}
EditableTitle.propTypes = {
  title: PropTypes.string,
  canEdit: PropTypes.bool,
  onSaveTitle: PropTypes.func.isRequired,
};
EditableTitle.defaultProps = {
  title: 'Title',
  canEdit: false,
};

export default EditableTitle;
