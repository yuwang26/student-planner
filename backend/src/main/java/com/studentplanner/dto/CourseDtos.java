package com.studentplanner.dto;

import jakarta.validation.constraints.NotBlank;

public class CourseDtos {

    public record CourseRequest(
            @NotBlank String name,
            String description,
            String color
    ) {}

    public record CourseResponse(
            Long id,
            String name,
            String description,
            String color,
            int homeworkCount
    ) {}
}
